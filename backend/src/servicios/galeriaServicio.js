import { GaleriaRepositorio } from '../repositorios/galeriaRepositorio.js';
import { GaleriaCatalogoServicio } from './galeriaCatalogoServicio.js';
import { requerido, validar } from '../utilidades/validador.js';
import { texto, entero } from '../utilidades/sanitizador.js';

export function mapearDisenoPublico(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    marcaId: fila.marca_id,
    titulo: fila.titulo,
    imagenRuta: fila.imagen_ruta,
    categoria: fila.categoria,
    temporada: fila.temporada,
    coloresRelacionados: fila.colores_relacionados
      ? fila.colores_relacionados.split(',').map((c) => c.trim()).filter(Boolean)
      : [],
    ordenVisualizacion: fila.orden_visualizacion,
    enTendencia: Boolean(fila.en_tendencia),
  };
}

export function mapearDisenoAdmin(fila) {
  if (!fila) return null;
  return {
    ...mapearDisenoPublico(fila),
    activo: Boolean(fila.activo),
    createdAt: fila.created_at,
    updatedAt: fila.updated_at,
  };
}

export class GaleriaServicio {
  constructor(
    galeriaRepo = new GaleriaRepositorio(),
    catalogoServicio = new GaleriaCatalogoServicio()
  ) {
    this.galeriaRepo = galeriaRepo;
    this.catalogoServicio = catalogoServicio;
  }

  async listarPublicos(marcaId) {
    const filas = await this.galeriaRepo.listarActivos(marcaId);
    return filas.map(mapearDisenoPublico);
  }

  async listarAdmin(marcaId) {
    const filas = await this.galeriaRepo.listarPorMarca(marcaId);
    return filas.map(mapearDisenoAdmin);
  }

  async crearAdmin(marcaId, datos) {
    const parsed = this.parsearDatos(datos);
    if (parsed.error) return parsed;

    const validacion = await this.validarCatalogoDiseno(marcaId, parsed.datos);
    if (validacion.error) return validacion;

    const id = await this.galeriaRepo.crear({ marcaId, ...parsed.datos });
    const fila = await this.galeriaRepo.buscarPorId(marcaId, id);
    return { diseno: mapearDisenoAdmin(fila) };
  }

  async actualizarAdmin(marcaId, id, datos) {
    const existente = await this.galeriaRepo.buscarPorId(marcaId, id);
    if (!existente) return { error: 'Diseno no encontrado.', codigoHttp: 404 };

    const parsed = this.parsearDatos(datos, existente);
    if (parsed.error) return parsed;

    const validacion = await this.validarCatalogoDiseno(marcaId, parsed.datos);
    if (validacion.error) return validacion;

    await this.galeriaRepo.actualizar(marcaId, id, parsed.datos);
    const fila = await this.galeriaRepo.buscarPorId(marcaId, id);
    return { diseno: mapearDisenoAdmin(fila) };
  }

  parsearDatos(datos, existente = null) {
    const titulo = texto(datos.titulo ?? existente?.titulo, { capitalizar: 'inicio' });
    const imagenRuta = texto(datos.imagen_ruta ?? datos.imagenRuta ?? existente?.imagen_ruta);
    const categoria = datos.categoria !== undefined
      ? texto(datos.categoria) || null
      : existente?.categoria ?? null;
    const temporada = datos.temporada !== undefined
      ? texto(datos.temporada) || null
      : existente?.temporada ?? null;
    const coloresRaw = datos.colores_relacionados ?? datos.coloresRelacionados ?? existente?.colores_relacionados;
    const coloresRelacionados = Array.isArray(coloresRaw)
      ? coloresRaw.map((c) => texto(c, { capitalizar: 'inicio' })).join(',')
      : texto(coloresRaw, { capitalizar: 'lista' }) || null;
    const activo = datos.activo !== undefined ? Boolean(datos.activo) : Boolean(existente?.activo ?? 1);
    const ordenVisualizacion = entero(
      datos.orden_visualizacion ?? datos.ordenVisualizacion ?? existente?.orden_visualizacion ?? 0
    ) ?? 0;
    const enTendencia = datos.en_tendencia !== undefined
      ? Boolean(datos.en_tendencia)
      : datos.enTendencia !== undefined
        ? Boolean(datos.enTendencia)
        : Boolean(existente?.en_tendencia ?? 0);

    const errores = validar(
      { titulo, imagen_ruta: imagenRuta },
      {
        titulo: (v) => requerido(v, 'titulo'),
        imagen_ruta: (v) => requerido(v, 'imagen'),
      }
    );

    if (Object.keys(errores).length > 0) {
      return { error: 'Datos invalidos.', errores, codigoHttp: 422 };
    }

    return {
      datos: {
        titulo,
        imagenRuta,
        categoria,
        temporada,
        coloresRelacionados,
        activo,
        ordenVisualizacion,
        enTendencia,
      },
    };
  }

  async validarCatalogoDiseno(marcaId, datos) {
    const valCategoria = await this.catalogoServicio.validarValorCatalogo(
      marcaId,
      'categoria',
      datos.categoria,
      { requerido: true }
    );
    if (valCategoria.error) return valCategoria;

    const valTemporada = await this.catalogoServicio.validarValorCatalogo(
      marcaId,
      'temporada',
      datos.temporada,
      { requerido: false }
    );
    if (valTemporada.error) return valTemporada;

    return { ok: true };
  }
}
