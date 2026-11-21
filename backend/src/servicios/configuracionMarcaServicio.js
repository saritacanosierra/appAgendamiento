import { ConfiguracionRepositorio } from '../repositorios/configuracionRepositorio.js';
import { UsuarioRepositorio } from '../repositorios/index.js';
import {
  mapearWhatsappApiAdmin,
  whatsappMarcaServicio,
} from './whatsappMarcaServicio.js';
import { parsearJsonCampo } from '../utilidades/mapeador.js';
import { normalizarHorariosMarca } from '../utilidades/horarios.js';
import { normalizarRutaMediaAlmacenamiento, resolverRutaMedia } from '../utilidades/resolverRutaMedia.js';
import { requerido, validar } from '../utilidades/validador.js';
import { texto } from '../utilidades/sanitizador.js';
import { generarSlug } from '../utilidades/slug.js';
import { validarPremioConfig } from '../utilidades/premioPuntos.js';
import { premioPuntosServicio } from './premioPuntosServicio.js';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const VERSION_POLITICA_PRIVACIDAD = 1;

function mapearPolitica(politica) {
  const aceptada = politica?.version === VERSION_POLITICA_PRIVACIDAD && Boolean(politica.aceptadaEn);
  return {
    version: VERSION_POLITICA_PRIVACIDAD,
    aceptada,
    aceptadaEn: aceptada ? politica.aceptadaEn : null,
  };
}

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
    codigoPais: wa.codigo_pais ?? '',
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

export function premioDesdeFila(fila) {
  const config = parsearJsonCampo(fila?.configuracion_json, {});
  const premio = config.premio_puntos;
  if (!premio || typeof premio !== 'object') {
    return { puntosNecesarios: '', porcentaje: '' };
  }
  return {
    puntosNecesarios: premio.puntos_necesarios ?? '',
    porcentaje: premio.porcentaje ?? '',
  };
}

function mapearConfiguracionAdmin(fila) {
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
    ciudad: fila.ciudad ?? null,
    horarios: normalizarHorariosMarca(parsearJsonCampo(fila.horarios_json, {})),
    whatsappApi: whatsappApiDesdeFila(fila),
    premioPuntos: premioDesdeFila(fila),
  };
}

export class ConfiguracionMarcaServicio {
  constructor(configRepo = new ConfiguracionRepositorio(), usuarioRepo = new UsuarioRepositorio()) {
    this.configRepo = configRepo;
    this.usuarioRepo = usuarioRepo;
  }

  async obtenerAdmin(marcaId) {
    const fila = await this.configRepo.obtenerAdmin(marcaId);
    if (!fila) return { error: 'Marca no encontrada.', codigoHttp: 404 };
    return { configuracion: mapearConfiguracionAdmin(fila) };
  }

  async resumenArranque(marcaId) {
    const fila = await this.configRepo.resumenArranque(marcaId);
    if (!fila || fila.marca === null || fila.marca === undefined) {
      return { error: 'Marca no encontrada.', codigoHttp: 404 };
    }
    return {
      resumen: {
        marca: Number(fila.marca) > 0,
        servicios: Number(fila.servicios) > 0,
        equipo: Number(fila.equipo) > 0,
        galeria: Number(fila.galeria) > 0,
        cantidadServicios: Number(fila.servicios) || 0,
      },
    };
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
    const ciudad = datos.ciudad !== undefined ? texto(datos.ciudad, { capitalizar: 'palabras' }) || null : actual.ciudad;
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

    const traePremio = datos.premio_puntos_necesarios !== undefined || datos.premioPuntosNecesarios !== undefined;
    if (traePremio) {
      const premio = validarPremioConfig(
        datos.premio_puntos_necesarios ?? datos.premioPuntosNecesarios,
        datos.premio_porcentaje ?? datos.premioPorcentaje
      );
      if (premio.error) return { error: premio.error, codigoHttp: 422 };
    }

    if (nombreComercial && nombreComercial !== actual.nombre_comercial) {
      await this.usuarioRepo.actualizarNombreAdmins(marcaId, nombreComercial);
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
      ciudad,
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

    if (traePremio) {
      const premioGuardado = await premioPuntosServicio.guardarConfig(marcaId, datos);
      if (premioGuardado.error) return premioGuardado;
    }

    if (datos.slug) {
      const slug = generarSlug(datos.slug);
      if (!slug) return { error: 'El enlace no es valido.', codigoHttp: 422 };
      if (slug !== actual.slug && await this.configRepo.slugOcupado(slug, marcaId)) {
        return { error: 'Ese enlace ya esta en uso.', codigoHttp: 409 };
      }
      if (slug !== actual.slug) await this.configRepo.actualizarSlug(marcaId, slug);
    }

    const fila = await this.configRepo.obtenerAdmin(marcaId);
    return { configuracion: mapearConfiguracionAdmin(fila) };
  }

  async obtenerPoliticaPrivacidad(marcaId) {
    const json = await this.configRepo.obtenerConfiguracionJson(marcaId);
    return { politica: mapearPolitica(json.politica_privacidad) };
  }

  async aceptarPoliticaPrivacidad(marcaId, usuario) {
    if (usuario?.rol !== 'admin') {
      return { error: 'Solo el propietario de la marca puede marcar de acuerdo.', codigoHttp: 403 };
    }

    const ahora = new Date();
    const aceptadaEn = ahora.toISOString().slice(0, 19).replace('T', ' ');
    await this.configRepo.actualizarConfiguracionJson(marcaId, {
      politica_privacidad: {
        version: VERSION_POLITICA_PRIVACIDAD,
        aceptadaEn,
        usuarioId: usuario.id,
      },
    });

    return {
      politica: {
        version: VERSION_POLITICA_PRIVACIDAD,
        aceptada: true,
        aceptadaEn,
      },
    };
  }
}
