import { parsearJsonCampo } from '../utilidades/mapeador.js';
import { requerido, validar } from '../utilidades/validador.js';
import { texto, entero } from '../utilidades/sanitizador.js';

export function mapearMarcaPublica(fila) {
  if (!fila) return null;

  return {
    id: fila.id,
    nombreComercial: fila.nombre_comercial,
    slug: fila.slug,
    colorPrincipal: fila.color_principal,
    colorSecundario: fila.color_secundario,
    colorFondo: fila.color_fondo ?? '#FFFFFF',
    colorTexto: fila.color_texto ?? '#1A1A1A',
    logo: fila.logo_ruta,
    descripcion: fila.descripcion,
    telefono: fila.telefono,
    whatsapp: fila.whatsapp,
    direccion: fila.direccion,
    horarios: parsearJsonCampo(fila.horarios_json, {}),
    tipografia: fila.tipografia ?? 'system-ui',
  };
}

export class MarcaServicio {
  constructor(marcaRepo) {
    this.marcaRepo = marcaRepo;
  }

  async obtenerPublicaPorSlug(slug) {
    const fila = await this.marcaRepo.buscarPorSlug(slug);
    return mapearMarcaPublica(fila);
  }
}

export function mapearServicioPublico(fila) {
  return {
    id: fila.id,
    marcaId: fila.marca_id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    imagenRuta: fila.imagen_ruta ?? null,
    duracionMinutos: fila.duracion_minutos,
    precio: Number(fila.precio),
    tipo: fila.tipo ?? 'marca',
    ordenVisualizacion: fila.orden_visualizacion,
  };
}

export function mapearServicioAdmin(fila) {
  return {
    ...mapearServicioPublico(fila),
    activo: Boolean(fila.activo),
  };
}

export class ServicioServicio {
  constructor(servicioRepo) {
    this.servicioRepo = servicioRepo;
  }

  async listarPublicos(marcaId) {
    const filas = await this.servicioRepo.listarActivosPorMarca(marcaId);
    return filas.map(mapearServicioPublico);
  }

  async listarAdmin(marcaId, opciones = {}) {
    const filas = await this.servicioRepo.listarPorMarca(marcaId, opciones);
    return filas.map(mapearServicioAdmin);
  }

  async listarAdicionalesActivos(marcaId) {
    const filas = await this.servicioRepo.listarAdicionalesActivosPorMarca(marcaId);
    return filas.map(mapearServicioPublico);
  }

  async crearAdmin(marcaId, datos) {
    const parsed = this.parsearDatosServicio(datos);
    if (parsed.error) return parsed;

    const id = await this.servicioRepo.crear({ marcaId, ...parsed.datos });
    const fila = await this.servicioRepo.buscarPorId(marcaId, id);
    return { servicio: mapearServicioAdmin(fila) };
  }

  async actualizarAdmin(marcaId, servicioId, datos) {
    const existente = await this.servicioRepo.buscarPorId(marcaId, servicioId);
    if (!existente) return { error: 'Servicio no encontrado.', codigoHttp: 404 };

    const parsed = this.parsearDatosServicio(datos, existente);
    if (parsed.error) return parsed;

    await this.servicioRepo.actualizar(marcaId, servicioId, parsed.datos);
    const fila = await this.servicioRepo.buscarPorId(marcaId, servicioId);
    return { servicio: mapearServicioAdmin(fila) };
  }

  async eliminarAdmin(marcaId, servicioId) {
    const existente = await this.servicioRepo.buscarPorId(marcaId, servicioId);
    if (!existente) return { error: 'Servicio no encontrado.', codigoHttp: 404 };

    const citas = await this.servicioRepo.contarCitas(marcaId, servicioId);
    if (citas > 0) {
      return {
        error:
          'No se puede eliminar porque tiene citas registradas. Desactivalo para ocultarlo en reservas.',
        codigoHttp: 409,
      };
    }

    await this.servicioRepo.eliminar(marcaId, servicioId);
    return { eliminado: true, id: servicioId };
  }

  parsearDatosServicio(datos, existente = null) {
    const nombre = texto(datos.nombre ?? existente?.nombre, { capitalizar: 'palabras' });
    const descripcion = datos.descripcion !== undefined
      ? texto(datos.descripcion) || null
      : existente?.descripcion ?? null;
    const tipoRaw = datos.tipo ?? existente?.tipo ?? 'marca';
    const tipo = tipoRaw === 'adicional' ? 'adicional' : 'marca';
    const duracionMinutos = datos.duracion_minutos ?? datos.duracionMinutos ?? existente?.duracion_minutos;
    const duracion = entero(duracionMinutos);
    const precioRaw = datos.precio ?? existente?.precio ?? 0;
    const precio = Number(precioRaw);
    const activo = datos.activo !== undefined ? Boolean(datos.activo) : Boolean(existente?.activo ?? 1);
    const ordenVisualizacion = entero(
      datos.orden_visualizacion ?? datos.ordenVisualizacion ?? existente?.orden_visualizacion ?? 0
    );
    const imagenRuta = datos.imagen_ruta !== undefined || datos.imagenRuta !== undefined
      ? texto(datos.imagen_ruta ?? datos.imagenRuta) || null
      : existente?.imagen_ruta ?? null;

    const errores = validar(
      { nombre, duracion_minutos: duracion, precio },
      {
        nombre: (v) => requerido(v, 'nombre'),
        duracion_minutos: (v) => {
          if (tipo === 'adicional') return null;
          if (!v || v < 5) return 'La duracion debe ser al menos 5 minutos.';
          if (v > 480) return 'La duracion no puede superar 480 minutos.';
          return null;
        },
        precio: (v) => (Number.isFinite(v) && v >= 0 ? null : 'El precio no puede ser negativo.'),
      }
    );

    if (Object.keys(errores).length > 0) {
      return { error: 'Datos invalidos.', errores, codigoHttp: 422 };
    }

    return {
      datos: {
        nombre,
        descripcion,
        imagenRuta,
        duracionMinutos: tipo === 'adicional' ? (duracion ?? 0) : duracion,
        precio,
        activo,
        tipo,
        ordenVisualizacion: ordenVisualizacion ?? 0,
      },
    };
  }
}
