import { ConfiguracionRepositorio } from '../repositorios/configuracionRepositorio.js';
import { parsearJsonCampo } from '../utilidades/mapeador.js';
import { normalizarHorariosMarca } from '../utilidades/horarios.js';
import { requerido, validar } from '../utilidades/validador.js';
import { texto } from '../utilidades/sanitizador.js';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

function validarColor(valor, campo) {
  if (!valor) return `El campo ${campo} es obligatorio.`;
  return HEX_COLOR.test(valor) ? null : `${campo} debe ser un color hexadecimal valido.`;
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
    logo: fila.logo_ruta,
    descripcion: fila.descripcion,
    telefono: fila.telefono,
    whatsapp: fila.whatsapp,
    direccion: fila.direccion,
    horarios: normalizarHorariosMarca(parsearJsonCampo(fila.horarios_json, {})),
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

    const nombreComercial = texto(datos.nombre_comercial ?? datos.nombreComercial ?? actual.nombre_comercial);
    const colorPrincipal = texto(datos.color_principal ?? datos.colorPrincipal ?? actual.color_principal);
    const colorSecundario = texto(datos.color_secundario ?? datos.colorSecundario ?? actual.color_secundario);
    const colorFondo = texto(datos.color_fondo ?? datos.colorFondo ?? actual.color_fondo ?? '#FFFFFF');
    const colorTexto = texto(datos.color_texto ?? datos.colorTexto ?? actual.color_texto ?? '#1A1A1A');
    const tipografia = texto(datos.tipografia ?? actual.tipografia ?? 'system-ui') || 'system-ui';
    const logoRuta = datos.logo ?? datos.logo_ruta ?? actual.logo_ruta ?? null;
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

    const fila = await this.configRepo.obtenerAdmin(marcaId);
    return { configuracion: mapearConfiguracionAdmin(fila) };
  }
}
