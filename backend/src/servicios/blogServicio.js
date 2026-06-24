import { BlogRepositorio } from '../repositorios/blogRepositorio.js';
import { slugUnico } from '../utilidades/slug.js';
import { requerido, validar } from '../utilidades/validador.js';
import { texto } from '../utilidades/sanitizador.js';

const ESTADOS_VALIDOS = new Set(['borrador', 'publicado']);

export function mapearPublicacionPublica(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    marcaId: fila.marca_id,
    titulo: fila.titulo,
    slug: fila.slug,
    imagenDestacada: fila.imagen_destacada,
    extracto: fila.extracto,
    categoria: fila.categoria,
    fechaPublicacion: fila.fecha_publicacion,
  };
}

export function mapearPublicacionAdmin(fila) {
  if (!fila) return null;
  return {
    ...mapearPublicacionPublica(fila),
    contenido: fila.contenido,
    estado: fila.estado,
    createdAt: fila.created_at,
    updatedAt: fila.updated_at,
  };
}

export class BlogServicio {
  constructor(blogRepo = new BlogRepositorio()) {
    this.blogRepo = blogRepo;
  }

  async listarPublicos(marcaId) {
    const filas = await this.blogRepo.listarPublicados(marcaId);
    return filas.map(mapearPublicacionPublica);
  }

  async obtenerPublicoPorSlug(marcaId, slug) {
    const fila = await this.blogRepo.buscarPublicadoPorSlug(marcaId, slug);
    if (!fila) return { error: 'Publicacion no encontrada.', codigoHttp: 404 };
    return { publicacion: mapearPublicacionAdmin(fila) };
  }

  async listarAdmin(marcaId) {
    const filas = await this.blogRepo.listarPorMarca(marcaId);
    return filas.map(mapearPublicacionAdmin);
  }

  async crearAdmin(marcaId, datos) {
    const parsed = await this.parsearDatos(marcaId, datos);
    if (parsed.error) return parsed;

    const id = await this.blogRepo.crear({ marcaId, ...parsed.datos });
    const fila = await this.blogRepo.buscarPorId(marcaId, id);
    return { publicacion: mapearPublicacionAdmin(fila) };
  }

  async actualizarAdmin(marcaId, id, datos) {
    const existente = await this.blogRepo.buscarPorId(marcaId, id);
    if (!existente) return { error: 'Publicacion no encontrada.', codigoHttp: 404 };

    const parsed = await this.parsearDatos(marcaId, datos, existente);
    if (parsed.error) return parsed;

    await this.blogRepo.actualizar(marcaId, id, parsed.datos);
    const fila = await this.blogRepo.buscarPorId(marcaId, id);
    return { publicacion: mapearPublicacionAdmin(fila) };
  }

  async parsearDatos(marcaId, datos, existente = null) {
    const titulo = texto(datos.titulo ?? existente?.titulo, { capitalizar: 'inicio' });
    const contenido = datos.contenido ?? existente?.contenido ?? '';
    const extracto = datos.extracto !== undefined
      ? texto(datos.extracto) || null
      : existente?.extracto ?? null;
    const categoria = datos.categoria !== undefined
      ? texto(datos.categoria) || null
      : existente?.categoria ?? null;
    const imagenDestacada = datos.imagen_destacada ?? datos.imagenDestacada ?? existente?.imagen_destacada ?? null;
    const estado = texto(datos.estado ?? existente?.estado ?? 'borrador');

    const errores = validar(
      { titulo, contenido, estado },
      {
        titulo: (v) => requerido(v, 'titulo'),
        contenido: (v) => requerido(v, 'contenido'),
        estado: (v) => (ESTADOS_VALIDOS.has(v) ? null : 'Estado invalido.'),
      }
    );

    if (Object.keys(errores).length > 0) {
      return { error: 'Datos invalidos.', errores, codigoHttp: 422 };
    }

    let slug = texto(datos.slug);
    if (!slug) {
      if (existente?.slug && (!datos.titulo || datos.titulo === existente.titulo)) {
        slug = existente.slug;
      } else {
        slug = await slugUnico(titulo, (candidato) =>
          this.blogRepo.existeSlug(marcaId, candidato, existente?.id ?? null)
        );
      }
    } else {
      const ocupado = await this.blogRepo.existeSlug(marcaId, slug, existente?.id ?? null);
      if (ocupado) {
        return { error: 'El slug ya esta en uso.', codigoHttp: 409 };
      }
    }

    let fechaPublicacion = existente?.fecha_publicacion ?? null;
    if (estado === 'publicado') {
      if (!fechaPublicacion) {
        fechaPublicacion = new Date();
      }
    } else {
      fechaPublicacion = null;
    }

    return {
      datos: {
        titulo,
        slug,
        imagenDestacada,
        extracto,
        contenido,
        categoria,
        estado,
        fechaPublicacion,
      },
    };
  }
}
