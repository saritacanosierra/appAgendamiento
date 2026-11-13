import { GaleriaRepositorio } from '../repositorios/galeriaRepositorio.js';
import { EstilistaRepositorio } from '../repositorios/estilistaRepositorio.js';
import { GaleriaCatalogoServicio } from './galeriaCatalogoServicio.js';
import { requerido, validar } from '../utilidades/validador.js';
import { texto, entero } from '../utilidades/sanitizador.js';
import { cacheLecturasPublicas } from '../utilidades/cacheLecturas.js';
import { normalizarRutaMediaAlmacenamiento, resolverRutaMedia } from '../utilidades/resolverRutaMedia.js';

export function mapearDisenoPublico(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    marcaId: fila.marca_id,
    titulo: fila.titulo,
    imagenRuta: resolverRutaMedia(fila.imagen_ruta),
    categoria: fila.categoria,
    temporada: fila.temporada,
    coloresRelacionados: fila.colores_relacionados
      ? fila.colores_relacionados.split(',').map((c) => c.trim()).filter(Boolean)
      : [],
    ordenVisualizacion: fila.orden_visualizacion,
    enTendencia: Boolean(fila.en_tendencia),
    estilistaId: fila.estilista_id ?? null,
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
    catalogoServicio = new GaleriaCatalogoServicio(),
    estilistaRepo = new EstilistaRepositorio()
  ) {
    this.galeriaRepo = galeriaRepo;
    this.catalogoServicio = catalogoServicio;
    this.estilistaRepo = estilistaRepo;
  }

  async listarPublicos(marcaId, limite = null) {
    const tope = Number(limite);
    const conTope = Number.isInteger(tope) && tope > 0 ? Math.min(tope, 24) : null;
    const cargar = async () => {
      const filas = await this.galeriaRepo.listarActivos(marcaId, conTope);
      return filas.map(mapearDisenoPublico);
    };
    if (!conTope) return cargar();
    return cacheLecturasPublicas.obtener(`galeria:${marcaId}:${conTope}`, cargar);
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

  async eliminarAdmin(marcaId, id) {
    const existente = await this.galeriaRepo.buscarPorId(marcaId, id);
    if (!existente) return { error: 'Diseno no encontrado.', codigoHttp: 404 };

    await this.galeriaRepo.eliminar(marcaId, id);
    return { ok: true };
  }

  parsearDatos(datos, existente = null) {
    const titulo = texto(datos.titulo ?? existente?.titulo, { capitalizar: 'inicio' });
    const imagenRuta = normalizarRutaMediaAlmacenamiento(
      texto(datos.imagen_ruta ?? datos.imagenRuta ?? existente?.imagen_ruta)
    );
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
    const estilistaEntrada = datos.estilista_id ?? datos.estilistaId ?? existente?.estilista_id ?? null;
    const estilistaId = estilistaEntrada === '' || estilistaEntrada === null || estilistaEntrada === undefined
      ? null
      : entero(estilistaEntrada);

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
        estilistaId,
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

    if (datos.estilistaId) {
      const estilista = await this.estilistaRepo.buscarPorId(marcaId, datos.estilistaId);
      if (!estilista) {
        return { error: 'La estilista no pertenece a esta marca.', codigoHttp: 422 };
      }
    }

    return { ok: true };
  }
}
