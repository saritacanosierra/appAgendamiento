import { ConfiguracionRepositorio } from '../repositorios/configuracionRepositorio.js';
import {
  mapearWhatsappApiAdmin,
  whatsappMarcaServicio,
} from './whatsappMarcaServicio.js';
import { parsearJsonCampo } from '../utilidades/mapeador.js';
import { normalizarHorariosMarca } from '../utilidades/horarios.js';
import { normalizarRutaMediaAlmacenamiento, resolverRutaMedia } from '../utilidades/resolverRutaMedia.js';
import { requerido, validar } from '../utilidades/validador.js';
import { texto } from '../utilidades/sanitizador.js';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

function validarColor(valor, campo) {
  if (!valor) return `El campo ${campo} es obligatorio.`;
  return HEX_COLOR.test(valor) ? null : `${campo} debe ser un color hexadecimal valido.`;
}

function whatsappApiDesdeFila(fila) {
  if (!fila) return null;
  const config = parsearJsonCampo(fila.configuracion_json, {});
  const wa = config.whatsapp_api ?? {};
  return mapearWhatsappApiAdmin({
    numeroPublico: fila.whatsapp,
    habilitado: Boolean(wa.habilitado),
    phoneNumberId: wa.phone_number_id ?? null,
    tokenConfigurado: Boolean(wa.token),
    codigoPais: wa.codigo_pais ?? '52',
    plantillaRecordatorio: wa.plantilla_recordatorio ?? null,
    plantillaIdioma: wa.plantilla_idioma ?? 'es_MX',
    configurado: Boolean(wa.habilitado && wa.phone_number_id && wa.token),
  });
}

function incluyeDatosWhatsappApi(datos) {
  return [
    'whatsapp_api_habilitado',
    'whatsappApiHabilitado',
    'whatsapp_phone_number_id',
    'whatsappPhoneNumberId',
    'whatsapp_token',
    'whatsappToken',
    'whatsapp_codigo_pais',
    'whatsappCodigoPais',
    'whatsapp_plantilla_recordatorio',
    'whatsappPlantillaRecordatorio',
    'whatsapp_plantilla_idioma',
    'whatsappPlantillaIdioma',
  ].some((clave) => datos[clave] !== undefined);
}

export function mapearConfiguracionAdmin(fila) {
  if (!fila) return null;

  return {
    id: fila.id,
    slug: fila.slug,
    nombreComercial: fila.nombre_comercial,
    colorPrincipal: fila.color_principal,
    colorSecundario: fila.color_secundario,
    colorFondo: fila.color_fondo ?? '#FFFFFF',
    colorTexto: fila.color_texto ?? '#1A1A1A',
    tipografia: fila.tipografia ?? 'system-ui',
    logo: resolverRutaMedia(fila.logo_ruta),
    descripcion: fila.descripcion,
    telefono: fila.telefono,
    whatsapp: fila.whatsapp,
    direccion: fila.direccion,
    horarios: normalizarHorariosMarca(parsearJsonCampo(fila.horarios_json, {})),
    whatsappApi: whatsappApiDesdeFila(fila),
  };
}

export class ConfiguracionMarcaServicio {
  constructor(configRepo = new ConfiguracionRepositorio()) {
    this.configRepo = configRepo;
  }

  async obtenerAdmin(marcaId) {
    const fila = await this.configRepo.obtenerAdmin(marcaId);
    if (!fila) return { error: 'Marca no encontrada.', codigoHttp: 404 };
    return { configuracion: mapearConfiguracionAdmin(fila) };
  }

  async actualizarAdmin(marcaId, datos) {
    const actual = await this.configRepo.obtenerAdmin(marcaId);
    if (!actual) return { error: 'Marca no encontrada.', codigoHttp: 404 };

    const nombreComercial = texto(datos.nombre_comercial ?? datos.nombreComercial ?? actual.nombre_comercial, { capitalizar: 'palabras' });
    const colorPrincipal = texto(datos.color_principal ?? datos.colorPrincipal ?? actual.color_principal);
    const colorSecundario = texto(datos.color_secundario ?? datos.colorSecundario ?? actual.color_secundario);
    const colorFondo = texto(datos.color_fondo ?? datos.colorFondo ?? actual.color_fondo ?? '#FFFFFF');
    const colorTexto = texto(datos.color_texto ?? datos.colorTexto ?? actual.color_texto ?? '#1A1A1A');
    const tipografia = texto(datos.tipografia ?? actual.tipografia ?? 'system-ui') || 'system-ui';
    const logoRuta = normalizarRutaMediaAlmacenamiento(
      datos.logo ?? datos.logo_ruta ?? actual.logo_ruta ?? null
    );
    const descripcion = datos.descripcion !== undefined
      ? texto(datos.descripcion) || null
      : actual.descripcion;
    const telefono = datos.telefono !== undefined ? texto(datos.telefono) || null : actual.telefono;
    const whatsapp = datos.whatsapp !== undefined ? texto(datos.whatsapp) || null : actual.whatsapp;
    const direccion = datos.direccion !== undefined ? texto(datos.direccion) || null : actual.direccion;
    const horariosJson = normalizarHorariosMarca(
      datos.horarios ?? parsearJsonCampo(actual.horarios_json, {})
    );

    const errores = validar(
      { nombreComercial, colorPrincipal, colorSecundario, colorFondo, colorTexto },
      {
        nombreComercial: (v) => requerido(v, 'nombre_comercial'),
        colorPrincipal: (v) => validarColor(v, 'color_principal'),
        colorSecundario: (v) => validarColor(v, 'color_secundario'),
        colorFondo: (v) => validarColor(v, 'color_fondo'),
        colorTexto: (v) => validarColor(v, 'color_texto'),
      }
    );

    if (Object.keys(errores).length > 0) {
      return { error: 'Datos invalidos.', errores, codigoHttp: 422 };
    }

    await this.configRepo.actualizarMarca(marcaId, {
      nombreComercial,
      colorPrincipal,
      colorSecundario,
      logoRuta,
      descripcion,
      telefono,
      whatsapp,
      direccion,
      horariosJson,
    });

    await this.configRepo.upsertConfiguracionVisual(marcaId, {
      colorFondo,
      colorTexto,
      tipografia,
    });

    if (incluyeDatosWhatsappApi(datos)) {
      await whatsappMarcaServicio.guardarConfigAdmin(marcaId, datos);
    }

    const fila = await this.configRepo.obtenerAdmin(marcaId);
    return { configuracion: mapearConfiguracionAdmin(fila) };
  }
}
