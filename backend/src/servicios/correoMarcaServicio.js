import { ConfiguracionRepositorio } from '../repositorios/configuracionRepositorio.js';
import { MarcaRepositorio } from '../repositorios/index.js';
import { texto } from '../utilidades/sanitizador.js';
import {
  PLANTILLA_CORREO_ASUNTO,
  PLANTILLA_CORREO_HTML,
  PLANTILLA_CORREO_TEXTO,
} from '../utilidades/plantillaNotificacion.js';

const CLAVE_SMTP = 'correo_smtp';
const CLAVE_CANALES = 'notificaciones_cita';

function booleano(valor, fallback = false) {
  if (valor === undefined || valor === null || valor === '') return fallback;
  if (typeof valor === 'boolean') return valor;
  if (valor === 1 || valor === '1' || valor === 'true') return true;
  if (valor === 0 || valor === '0' || valor === 'false') return false;
  return Boolean(valor);
}

function normalizarCanales(raw = {}) {
  return {
    whatsapp: booleano(raw.whatsapp, false),
    correo: booleano(raw.correo, false),
  };
}

function normalizarSmtp(raw = {}) {
  const modo = texto(raw.modo_plantilla ?? raw.modoPlantilla).toLowerCase() === 'html'
    ? 'html'
    : 'texto';
  return {
    host: texto(raw.host) || '',
    puerto: Number(raw.puerto ?? 587) || 587,
    seguro: booleano(raw.seguro, false),
    usuario: texto(raw.usuario) || '',
    contrasena: texto(raw.contrasena) || '',
    remitente: texto(raw.remitente) || '',
    modoPlantilla: modo,
    asunto: texto(raw.asunto) || PLANTILLA_CORREO_ASUNTO,
    cuerpoTexto: texto(raw.cuerpo_texto ?? raw.cuerpoTexto) || PLANTILLA_CORREO_TEXTO,
    cuerpoHtml: texto(raw.cuerpo_html ?? raw.cuerpoHtml) || PLANTILLA_CORREO_HTML,
  };
}

function aJsonSmtp(config) {
  return {
    host: config.host || '',
    puerto: config.puerto || 587,
    seguro: Boolean(config.seguro),
    usuario: config.usuario || '',
    contrasena: config.contrasena || '',
    remitente: config.remitente || '',
    modo_plantilla: config.modoPlantilla || 'texto',
    asunto: config.asunto || PLANTILLA_CORREO_ASUNTO,
    cuerpo_texto: config.cuerpoTexto || PLANTILLA_CORREO_TEXTO,
    cuerpo_html: config.cuerpoHtml || PLANTILLA_CORREO_HTML,
  };
}

function smtpListo(smtp) {
  return Boolean(smtp.host && smtp.usuario && smtp.contrasena && (smtp.remitente || smtp.usuario));
}

export class CorreoMarcaServicio {
  constructor(deps = {}) {
    this.configRepo = deps.configRepo ?? new ConfiguracionRepositorio();
    this.marcaRepo = deps.marcaRepo ?? new MarcaRepositorio();
  }

  async leerJson(marcaId) {
    return this.configRepo.obtenerConfiguracionJson(marcaId);
  }

  async leerCanales(marcaId) {
    const json = await this.leerJson(marcaId);
    const canales = normalizarCanales(json[CLAVE_CANALES] ?? {});
    // Compatibilidad: si nunca guardaron canales y WhatsApp ya estaba activo, respetarlo.
    if (json[CLAVE_CANALES] == null) {
      const wa = json.whatsapp_api ?? {};
      canales.whatsapp = Boolean(wa.habilitado);
    }
    return canales;
  }

  async leerSmtpInterno(marcaId) {
    const json = await this.leerJson(marcaId);
    return normalizarSmtp(json[CLAVE_SMTP] ?? {});
  }

  async obtenerEstadoAdmin(marcaId) {
    const marca = await this.marcaRepo.buscarPorIdCompleto(marcaId);
    if (!marca) return { error: 'Marca no encontrada.', codigoHttp: 404 };

    const [canales, smtp] = await Promise.all([
      this.leerCanales(marcaId),
      this.leerSmtpInterno(marcaId),
    ]);
    const listo = smtpListo(smtp);

    return {
      canales,
      correo: {
        host: smtp.host,
        puerto: smtp.puerto,
        seguro: smtp.seguro,
        usuario: smtp.usuario,
        contrasenaConfigurada: Boolean(smtp.contrasena),
        remitente: smtp.remitente || smtp.usuario || '',
        modoPlantilla: smtp.modoPlantilla,
        asunto: smtp.asunto,
        cuerpoTexto: smtp.cuerpoTexto,
        cuerpoHtml: smtp.cuerpoHtml,
        listo,
        mensaje: listo
          ? 'Los avisos de correo saldran desde el buzon de esta marca.'
          : 'Pega el SMTP de tu correo (Gmail u Outlook) para enviar sin costo extra.',
      },
    };
  }

  async guardarConfigAdmin(marcaId, datosEntrada = {}) {
    const actualJson = await this.leerJson(marcaId);
    const canalesActuales = normalizarCanales(actualJson[CLAVE_CANALES] ?? {});
    const smtpActual = normalizarSmtp(actualJson[CLAVE_SMTP] ?? {});

    const canales = {
      whatsapp: datosEntrada.notificaciones_whatsapp !== undefined
        || datosEntrada.notificacionesWhatsapp !== undefined
        || datosEntrada.canal_whatsapp !== undefined
        || datosEntrada.canalWhatsapp !== undefined
        ? booleano(
          datosEntrada.notificaciones_whatsapp
            ?? datosEntrada.notificacionesWhatsapp
            ?? datosEntrada.canal_whatsapp
            ?? datosEntrada.canalWhatsapp
        )
        : canalesActuales.whatsapp,
      correo: datosEntrada.notificaciones_correo !== undefined
        || datosEntrada.notificacionesCorreo !== undefined
        || datosEntrada.canal_correo !== undefined
        || datosEntrada.canalCorreo !== undefined
        ? booleano(
          datosEntrada.notificaciones_correo
            ?? datosEntrada.notificacionesCorreo
            ?? datosEntrada.canal_correo
            ?? datosEntrada.canalCorreo
        )
        : canalesActuales.correo,
    };

    const contrasenaNueva = texto(
      datosEntrada.correo_smtp_contrasena ?? datosEntrada.correoSmtpContrasena
    );
    const modoEntrada = texto(
      datosEntrada.correo_smtp_modo ?? datosEntrada.correoSmtpModo ?? datosEntrada.correo_modo_plantilla
    ).toLowerCase();

    const smtp = normalizarSmtp({
      host: datosEntrada.correo_smtp_host ?? datosEntrada.correoSmtpHost ?? smtpActual.host,
      puerto: datosEntrada.correo_smtp_puerto ?? datosEntrada.correoSmtpPuerto ?? smtpActual.puerto,
      seguro: datosEntrada.correo_smtp_seguro ?? datosEntrada.correoSmtpSeguro ?? smtpActual.seguro,
      usuario: datosEntrada.correo_smtp_usuario ?? datosEntrada.correoSmtpUsuario ?? smtpActual.usuario,
      contrasena: contrasenaNueva || smtpActual.contrasena,
      remitente: datosEntrada.correo_smtp_remitente ?? datosEntrada.correoSmtpRemitente ?? smtpActual.remitente,
      modo_plantilla: modoEntrada || smtpActual.modoPlantilla,
      asunto: datosEntrada.correo_asunto ?? datosEntrada.correoAsunto ?? smtpActual.asunto,
      cuerpo_texto: datosEntrada.correo_cuerpo_texto ?? datosEntrada.correoCuerpoTexto ?? smtpActual.cuerpoTexto,
      cuerpo_html: datosEntrada.correo_cuerpo_html ?? datosEntrada.correoCuerpoHtml ?? smtpActual.cuerpoHtml,
    });

    await this.configRepo.actualizarConfiguracionJson(marcaId, {
      [CLAVE_CANALES]: canales,
      [CLAVE_SMTP]: aJsonSmtp(smtp),
    });

    return this.obtenerEstadoAdmin(marcaId);
  }

  async obtenerCredencialesEnvio(marcaId) {
    const [canales, smtp, marca] = await Promise.all([
      this.leerCanales(marcaId),
      this.leerSmtpInterno(marcaId),
      this.marcaRepo.buscarPorId(marcaId),
    ]);

    return {
      marcaId,
      canalActivo: Boolean(canales.correo),
      listo: smtpListo(smtp),
      smtp,
      marca: {
        nombreComercial: marca?.nombre_comercial ?? null,
        whatsapp: marca?.whatsapp ?? null,
        telefono: marca?.telefono ?? null,
        slug: marca?.slug ?? null,
      },
    };
  }
}

export const correoMarcaServicio = new CorreoMarcaServicio();

export function mapearNotificacionesAdmin(estado) {
  if (!estado || estado.error) return null;
  return {
    canales: estado.canales,
    correo: estado.correo,
  };
}

export function incluyeDatosNotificaciones(datos = {}) {
  return [
    'notificaciones_whatsapp',
    'notificacionesWhatsapp',
    'notificaciones_correo',
    'notificacionesCorreo',
    'canal_whatsapp',
    'canalWhatsapp',
    'canal_correo',
    'canalCorreo',
    'correo_smtp_host',
    'correoSmtpHost',
    'correo_smtp_puerto',
    'correoSmtpPuerto',
    'correo_smtp_seguro',
    'correoSmtpSeguro',
    'correo_smtp_usuario',
    'correoSmtpUsuario',
    'correo_smtp_contrasena',
    'correoSmtpContrasena',
    'correo_smtp_remitente',
    'correoSmtpRemitente',
    'correo_smtp_modo',
    'correoSmtpModo',
    'correo_asunto',
    'correoAsunto',
    'correo_cuerpo_texto',
    'correoCuerpoTexto',
    'correo_cuerpo_html',
    'correoCuerpoHtml',
  ].some((clave) => datos[clave] !== undefined);
}
