import { CarruselRepositorio } from '../repositorios/carruselRepositorio.js';
import { requerido, validar } from '../utilidades/validador.js';
import { texto, entero } from '../utilidades/sanitizador.js';

export function mapearDiapositivaPublica(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    titulo: fila.titulo,
    subtitulo: fila.subtitulo,
    imagenRuta: fila.imagen_ruta,
    enlaceUrl: fila.enlace_url,
    ordenVisualizacion: fila.orden_visualizacion,
  };
}

export function mapearDiapositivaAdmin(fila) {
  if (!fila) return null;
  return {
    ...mapearDiapositivaPublica(fila),
    marcaId: fila.marca_id,
    activo: Boolean(fila.activo),
    createdAt: fila.created_at,
    updatedAt: fila.updated_at,
  };
}

export class CarruselServicio {
  constructor(carruselRepo = new CarruselRepositorio()) {
    this.carruselRepo = carruselRepo;
  }

  async listarPublicos(marcaId) {
    const filas = await this.carruselRepo.listarActivos(marcaId);
    return filas.map(mapearDiapositivaPublica);
  }

  async listarAdmin(marcaId) {
    const filas = await this.carruselRepo.listarPorMarca(marcaId);
    return filas.map(mapearDiapositivaAdmin);
  }

  async crearAdmin(marcaId, datos) {
    const parsed = this.parsearDatos(datos);
    if (parsed.error) return parsed;

    const id = await this.carruselRepo.crear({ marcaId, ...parsed.datos });
    const fila = await this.carruselRepo.buscarPorId(marcaId, id);
    return { diapositiva: mapearDiapositivaAdmin(fila) };
  }

  async actualizarAdmin(marcaId, id, datos) {
    const existente = await this.carruselRepo.buscarPorId(marcaId, id);
    if (!existente) return { error: 'Diapositiva no encontrada.', codigoHttp: 404 };

    const parsed = this.parsearDatos(datos, existente);
    if (parsed.error) return parsed;

    await this.carruselRepo.actualizar(marcaId, id, parsed.datos);
    const fila = await this.carruselRepo.buscarPorId(marcaId, id);
    return { diapositiva: mapearDiapositivaAdmin(fila) };
  }

  parsearDatos(datos, existente = null) {
    const titulo = texto(datos.titulo ?? existente?.titulo);
    const subtitulo =
      datos.subtitulo !== undefined
        ? texto(datos.subtitulo) || null
        : existente?.subtitulo ?? null;
    const imagenRuta = texto(datos.imagen_ruta ?? datos.imagenRuta ?? existente?.imagen_ruta);
    const enlaceUrl =
      datos.enlace_url !== undefined || datos.enlaceUrl !== undefined
        ? texto(datos.enlace_url ?? datos.enlaceUrl) || null
        : existente?.enlace_url ?? null;
    const activo =
      datos.activo !== undefined ? Boolean(datos.activo) : Boolean(existente?.activo ?? 1);
    const ordenVisualizacion =
      entero(datos.orden_visualizacion ?? datos.ordenVisualizacion ?? existente?.orden_visualizacion ?? 0) ?? 0;

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
        subtitulo,
        imagenRuta,
        enlaceUrl,
        activo,
        ordenVisualizacion,
      },
    };
  }
}

export const carruselServicio = new CarruselServicio();
