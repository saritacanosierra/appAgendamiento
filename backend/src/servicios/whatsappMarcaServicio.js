import { ConfiguracionRepositorio } from '../repositorios/configuracionRepositorio.js';
import { MarcaRepositorio } from '../repositorios/index.js';
import { texto } from '../utilidades/sanitizador.js';

const CLAVE_JSON = 'whatsapp_api';

function normalizarConfigWhatsapp(raw = {}) {
  return {
    habilitado: Boolean(raw.habilitado),
    phoneNumberId: texto(raw.phone_number_id ?? raw.phoneNumberId) || null,
    token: texto(raw.token) || null,
    codigoPais: texto(raw.codigo_pais ?? raw.codigoPais) || '52',
    plantillaRecordatorio: texto(raw.plantilla_recordatorio ?? raw.plantillaRecordatorio) || null,
    plantillaIdioma: texto(raw.plantilla_idioma ?? raw.plantillaIdioma) || 'es_MX',
  };
}

function aJsonWhatsapp(config) {
  return {
    habilitado: Boolean(config.habilitado),
    phone_number_id: config.phoneNumberId || null,
    token: config.token || null,
    codigo_pais: config.codigoPais || '52',
    plantilla_recordatorio: config.plantillaRecordatorio || null,
    plantilla_idioma: config.plantillaIdioma || 'es_MX',
  };
}

export class WhatsappMarcaServicio {
  constructor(deps = {}) {
    this.configRepo = deps.configRepo ?? new ConfiguracionRepositorio();
    this.marcaRepo = deps.marcaRepo ?? new MarcaRepositorio();
  }

  async leerConfigInterna(marcaId) {
    const config = await this.configRepo.obtenerConfiguracionJson(marcaId);
    return normalizarConfigWhatsapp(config[CLAVE_JSON] ?? {});
  }

  async obtenerEstadoAdmin(marcaId) {
    const [marca, wa] = await Promise.all([
      this.marcaRepo.buscarPorIdCompleto(marcaId),
      this.leerConfigInterna(marcaId),
    ]);

    if (!marca) return { error: 'Marca no encontrada.', codigoHttp: 404 };

    const configurado = Boolean(wa.habilitado && wa.phoneNumberId && wa.token);

    return {
      numeroPublico: marca.whatsapp ?? null,
      habilitado: wa.habilitado,
      phoneNumberId: wa.phoneNumberId,
      tokenConfigurado: Boolean(wa.token),
      codigoPais: wa.codigoPais,
      plantillaRecordatorio: wa.plantillaRecordatorio,
      plantillaIdioma: wa.plantillaIdioma,
      configurado,
      mensaje: configurado
        ? 'Esta marca enviara WhatsApp desde su propio numero de Meta.'
        : 'Configura el Phone Number ID y token de Meta para esta marca.',
    };
  }

  async guardarConfigAdmin(marcaId, datosEntrada) {
    const actual = await this.leerConfigInterna(marcaId);
    const tokenNuevo = texto(datosEntrada.whatsapp_token ?? datosEntrada.whatsappToken);

    const habilitado = datosEntrada.whatsapp_api_habilitado !== undefined
      ? Boolean(datosEntrada.whatsapp_api_habilitado)
      : datosEntrada.whatsappApiHabilitado !== undefined
        ? Boolean(datosEntrada.whatsappApiHabilitado)
        : actual.habilitado;

    const actualizada = normalizarConfigWhatsapp({
      habilitado,
      phone_number_id:
        datosEntrada.whatsapp_phone_number_id
        ?? datosEntrada.whatsappPhoneNumberId
        ?? actual.phoneNumberId,
      token: tokenNuevo || actual.token,
      codigo_pais:
        datosEntrada.whatsapp_codigo_pais ?? datosEntrada.whatsappCodigoPais ?? actual.codigoPais,
      plantilla_recordatorio:
        datosEntrada.whatsapp_plantilla_recordatorio
        ?? datosEntrada.whatsappPlantillaRecordatorio
        ?? actual.plantillaRecordatorio,
      plantilla_idioma:
        datosEntrada.whatsapp_plantilla_idioma
        ?? datosEntrada.whatsappPlantillaIdioma
        ?? actual.plantillaIdioma,
    });

    await this.configRepo.actualizarConfiguracionJson(marcaId, {
      [CLAVE_JSON]: aJsonWhatsapp(actualizada),
    });

    return this.obtenerEstadoAdmin(marcaId);
  }

  async obtenerCredenciales(marcaId) {
    const [marca, wa] = await Promise.all([
      this.marcaRepo.buscarPorId(marcaId),
      this.leerConfigInterna(marcaId),
    ]);

    const configurado = Boolean(marca && wa.habilitado && wa.phoneNumberId && wa.token);

    return {
      marcaId,
      configurado,
      phoneNumberId: wa.phoneNumberId,
      token: wa.token,
      codigoPais: wa.codigoPais,
      plantillaRecordatorio: wa.plantillaRecordatorio,
      plantillaIdioma: wa.plantillaIdioma,
      numeroPublico: marca?.whatsapp ?? null,
      nombreMarca: marca?.nombre_comercial ?? null,
    };
  }
}

export const whatsappMarcaServicio = new WhatsappMarcaServicio();

export function mapearWhatsappApiAdmin(estado) {
  if (!estado || estado.error) return null;
  return {
    numeroPublico: estado.numeroPublico,
    habilitado: estado.habilitado,
    phoneNumberId: estado.phoneNumberId,
    tokenConfigurado: estado.tokenConfigurado,
    codigoPais: estado.codigoPais,
    plantillaRecordatorio: estado.plantillaRecordatorio,
    plantillaIdioma: estado.plantillaIdioma,
    configurado: estado.configurado,
    mensaje: estado.mensaje,
  };
}
