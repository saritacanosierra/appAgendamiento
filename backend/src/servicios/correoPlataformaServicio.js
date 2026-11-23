import { ConfiguracionPlataformaRepositorio } from '../repositorios/plataformaRepositorio.js';
import { emailServicio } from './emailServicio.js';
import { email as validarEmail, telefono as validarTelefono } from '../utilidades/validador.js';
import { texto } from '../utilidades/sanitizador.js';

export const CLAVES_SMTP_PLATAFORMA = {
  host: 'smtp_host',
  puerto: 'smtp_puerto',
  seguro: 'smtp_seguro',
  usuario: 'smtp_usuario',
  contrasena: 'smtp_contrasena',
  remitente: 'smtp_remitente',
  celularRecuperacion: 'smtp_celular_recuperacion',
  resendApiKey: 'resend_api_key',
};

function textoClave(valor) {
  const t = String(valor ?? '').trim();
  return t || '';
}

export class CorreoPlataformaServicio {
  constructor(deps = {}) {
    this.config = deps.config ?? new ConfiguracionPlataformaRepositorio();
    this.email = deps.email ?? emailServicio;
    this.entorno = deps.entorno ?? process.env;
  }

  async #leer(clave, envKey = null) {
    const guardado = textoClave(await this.config.obtener(clave));
    if (guardado) return { valor: guardado, fuente: 'plataforma' };
    if (envKey) {
      const entorno = textoClave(this.entorno[envKey]);
      if (entorno) return { valor: entorno, fuente: 'entorno' };
    }
    return { valor: '', fuente: 'ninguna' };
  }

  async leerCredenciales() {
    const [host, puerto, seguro, usuario, contrasena, remitente, celular, resend] = await Promise.all([
      this.#leer(CLAVES_SMTP_PLATAFORMA.host, 'SMTP_HOST'),
      this.#leer(CLAVES_SMTP_PLATAFORMA.puerto, 'SMTP_PUERTO'),
      this.#leer(CLAVES_SMTP_PLATAFORMA.seguro, 'SMTP_SEGURO'),
      this.#leer(CLAVES_SMTP_PLATAFORMA.usuario, 'SMTP_USUARIO'),
      this.#leer(CLAVES_SMTP_PLATAFORMA.contrasena, 'SMTP_CONTRASENA'),
      this.#leer(CLAVES_SMTP_PLATAFORMA.remitente, 'EMAIL_REMITENTE'),
      this.#leer(CLAVES_SMTP_PLATAFORMA.celularRecuperacion, 'SUPERADMIN_CELULAR'),
      this.#leer(CLAVES_SMTP_PLATAFORMA.resendApiKey, 'RESEND_API_KEY'),
    ]);

    const puertoNum = Number(puerto.valor || 587) || 587;
    const seguroBool = seguro.valor === '1' || seguro.valor === 'true';
    const resendApiKey = resend.valor;
    const smtpListo = Boolean(host.valor && usuario.valor && contrasena.valor);
    const resendListo = Boolean(resendApiKey);

    return {
      host: host.valor,
      puerto: puertoNum,
      seguro: seguroBool,
      usuario: usuario.valor,
      contrasena: contrasena.valor,
      remitente: remitente.valor || usuario.valor || 'Agenda <onboarding@resend.dev>',
      celularRecuperacion: celular.valor.replace(/\D+/g, ''),
      resendApiKey,
      proveedor: resendListo ? 'resend' : (smtpListo ? 'smtp' : 'ninguno'),
      fuentes: {
        host: host.fuente,
        usuario: usuario.fuente,
        contrasena: contrasena.fuente,
        resend: resend.fuente,
      },
    };
  }

  async obtenerEstadoAdmin() {
    const c = await this.leerCredenciales();
    const listo = c.proveedor !== 'ninguno';
    return {
      listo,
      proveedor: c.proveedor,
      host: c.host,
      puerto: c.puerto,
      seguro: c.seguro,
      usuario: c.usuario,
      remitente: c.remitente,
      celularRecuperacion: c.celularRecuperacion,
      contrasenaConfigurada: Boolean(c.contrasena),
      resendConfigurado: Boolean(c.resendApiKey),
      desdeEntorno: c.fuentes.host === 'entorno'
        || c.fuentes.usuario === 'entorno'
        || c.fuentes.resend === 'entorno',
    };
  }

  async guardarConfigAdmin(datos = {}) {
    const actual = await this.leerCredenciales();
    const tomar = (entrante, previo) => {
      const v = texto(entrante);
      return v || previo;
    };

    let host = tomar(datos.host ?? datos.smtp_host, actual.host);
    const puerto = Number(datos.puerto ?? datos.smtp_puerto ?? actual.puerto) || 587;
    const seguro = Boolean(datos.seguro ?? datos.smtp_seguro ?? actual.seguro);
    let usuario = tomar(datos.usuario ?? datos.smtp_usuario, actual.usuario).toLowerCase();
    if (usuario.endsWith('@gmial.com')) {
      usuario = `${usuario.slice(0, -'@gmial.com'.length)}@gmail.com`;
    }

    const remitenteCrudo = String(datos.remitente ?? datos.smtp_remitente ?? '').trim();
    let remitente = remitenteCrudo || actual.remitente || usuario;
    if (remitente && !remitente.includes('@') && usuario) {
      remitente = `${remitente} <${usuario}>`;
    }

    const celularEntrante = datos.celular_recuperacion ?? datos.celularRecuperacion;
    const celular = String(
      celularEntrante === undefined || celularEntrante === null
        ? (actual.celularRecuperacion || '')
        : texto(celularEntrante)
    ).replace(/\D+/g, '');

    const contrasenaNueva = String(
      datos.contrasena ?? datos.smtp_contrasena ?? datos.contrasena_nueva ?? ''
    ).trim();
    const contrasena = contrasenaNueva || actual.contrasena;

    const resendNueva = String(datos.resend_api_key ?? datos.resendApiKey ?? '').trim();
    const resendApiKey = resendNueva || actual.resendApiKey;

    if (!host && (usuario.endsWith('@gmail.com') || usuario.endsWith('@googlemail.com'))) {
      host = 'smtp.gmail.com';
    }

    const errores = {};
    const tieneResend = Boolean(resendApiKey);
    const tieneSmtp = Boolean(host && usuario && contrasena);

    if (!tieneResend && !tieneSmtp) {
      if (!resendApiKey) {
        errores.resend_api_key = 'Pega la API key de Resend (recomendado en Render).';
      }
      if (!host) errores.host = 'O configura SMTP (host).';
      if (!usuario || validarEmail(usuario)) {
        errores.usuario = 'Correo invalido. Revisa que diga gmail.com (no gmial).';
      }
      if (!contrasena) errores.contrasena = 'Indica la contrasena de aplicacion SMTP.';
    } else if (usuario && validarEmail(usuario)) {
      errores.usuario = 'Correo invalido. Revisa que diga gmail.com (no gmial).';
    }

    if (celular && validarTelefono(celular)) {
      errores.celular_recuperacion = 'Celular de recuperacion invalido (min. 10 digitos).';
    }

    if (Object.keys(errores).length > 0) {
      return { error: 'Revisa los campos del correo.', errores, codigoHttp: 422 };
    }

    if (host) await this.config.guardar(CLAVES_SMTP_PLATAFORMA.host, host);
    await this.config.guardar(CLAVES_SMTP_PLATAFORMA.puerto, String(puerto));
    await this.config.guardar(CLAVES_SMTP_PLATAFORMA.seguro, seguro ? '1' : '0');
    if (usuario) await this.config.guardar(CLAVES_SMTP_PLATAFORMA.usuario, usuario);
    if (contrasena) await this.config.guardar(CLAVES_SMTP_PLATAFORMA.contrasena, contrasena);
    await this.config.guardar(CLAVES_SMTP_PLATAFORMA.remitente, remitente || usuario || actual.remitente);
    await this.config.guardar(CLAVES_SMTP_PLATAFORMA.celularRecuperacion, celular || null);
    if (resendApiKey) {
      await this.config.guardar(CLAVES_SMTP_PLATAFORMA.resendApiKey, resendApiKey);
    }

    return this.obtenerEstadoAdmin();
  }

  async obtenerCelularRecuperacion() {
    const c = await this.leerCredenciales();
    return c.celularRecuperacion || '';
  }

  async probarEnvio(correoDestino) {
    const destino = texto(correoDestino).toLowerCase();
    if (!destino || validarEmail(destino)) {
      return { error: 'Indica un correo valido para la prueba.', codigoHttp: 422 };
    }

    const cred = await this.leerCredenciales();
    if (cred.proveedor === 'ninguno') {
      return {
        error: 'Primero guarda Resend (API key) o el SMTP de la plataforma.',
        codigoHttp: 422,
      };
    }

    const resultado = await this.email.enviarPlataforma({
      para: destino,
      asunto: 'Prueba de correo — plataforma',
      texto: 'Si lees esto, la plataforma ya puede enviar recuperaciones de contrasena.',
      html: '<p>Si lees esto, la plataforma ya puede enviar recuperaciones de contraseña.</p>',
      credenciales: cred,
    });

    if (resultado.error || resultado.omitido) {
      return {
        error: resultado.motivo || 'No se pudo enviar la prueba.',
        codigoHttp: 502,
      };
    }

    return {
      enviado: true,
      mensaje: cred.proveedor === 'resend'
        ? 'Correo de prueba enviado con Resend.'
        : 'Correo de prueba enviado.',
      proveedor: cred.proveedor,
    };
  }
}

export const correoPlataformaServicio = new CorreoPlataformaServicio();
