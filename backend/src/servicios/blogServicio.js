import { BlogRepositorio } from '../repositorios/blogRepositorio.js';
import { slugUnico } from '../utilidades/slug.js';
import { requerido, validar } from '../utilidades/validador.js';
import { texto } from '../utilidades/sanitizador.js';
import { normalizarRutaMediaAlmacenamiento, resolverRutaMedia } from '../utilidades/resolverRutaMedia.js';

const ESTADOS_VALIDOS = new Set(['borrador', 'publicado']);

export function mapearPublicacionPublica(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    marcaId: fila.marca_id,
    titulo: fila.titulo,
    slug: fila.slug,
    imagenDestacada: resolverRutaMedia(fila.imagen_destacada),
    extracto: fila.extracto,
    categoria: fila.categoria,
    fechaPublicacion: fila.fecha_publicacion,
  };
}

export function mapearPublicacionAdmin(fila, opciones = {}) {
  if (!fila) return null;
  return {
    ...mapearPublicacionPublica(fila),
    contenido: fila.contenido,
    estado: fila.estado,
    createdAt: fila.created_at,
    updatedAt: fila.updated_at,
    deLaApp: Boolean(opciones.deLaApp),
  };
}

function porFecha(a, b) {
  const fa = new Date(a.fechaPublicacion || 0).getTime();
  const fb = new Date(b.fechaPublicacion || 0).getTime();
  return fb - fa;
}

export class BlogServicio {
  constructor(blogRepo = new BlogRepositorio()) {
    this.blogRepo = blogRepo;
  }

  async listarPublicos(marcaId) {
    const [propias, deLaApp] = await Promise.all([
      this.blogRepo.listarPublicados(marcaId),
      this.blogRepo.listarPublicadosPlataforma(),
    ]);
    return [
      ...propias.map((fila) => mapearPublicacionPublica(fila)),
      ...deLaApp.map((fila) => ({ ...mapearPublicacionPublica(fila), deLaApp: true })),
    ].sort(porFecha);
  }

  async obtenerPublicoPorSlug(marcaId, slug, origenApp = false) {
    if (origenApp) {
      const deLaApp = await this.blogRepo.buscarPublicadoPlataformaPorSlug(slug);
      if (!deLaApp) return { error: 'Publicacion no encontrada.', codigoHttp: 404 };
      return { publicacion: mapearPublicacionAdmin(deLaApp, { deLaApp: true }) };
    }

    const fila = await this.blogRepo.buscarPublicadoPorSlug(marcaId, slug);
    if (fila) return { publicacion: mapearPublicacionAdmin(fila) };

    const deLaApp = await this.blogRepo.buscarPublicadoPlataformaPorSlug(slug);
    if (!deLaApp) return { error: 'Publicacion no encontrada.', codigoHttp: 404 };
    return { publicacion: mapearPublicacionAdmin(deLaApp, { deLaApp: true }) };
  }

  async listarAdmin(marcaId) {
    const [propias, deLaApp] = await Promise.all([
      this.blogRepo.listarPorMarca(marcaId),
      this.blogRepo.listarPublicadosPlataforma(),
    ]);
    return [
      ...deLaApp.map((fila) => mapearPublicacionAdmin(fila, { deLaApp: true })),
      ...propias.map((fila) => mapearPublicacionAdmin(fila)),
    ];
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

  async listarPlataforma() {
    const filas = await this.blogRepo.listarPlataforma();
    return filas.map((fila) => mapearPublicacionAdmin(fila, { deLaApp: true }));
  }

  async crearPlataforma(datos) {
    const parsed = await this.parsearDatos(null, datos, null, 'plataforma');
    if (parsed.error) return parsed;

    const id = await this.blogRepo.crearPlataforma(parsed.datos);
    const fila = await this.blogRepo.buscarPlataformaPorId(id);
    return { publicacion: mapearPublicacionAdmin(fila, { deLaApp: true }) };
  }

  async actualizarPlataforma(id, datos) {
    const existente = await this.blogRepo.buscarPlataformaPorId(id);
    if (!existente) return { error: 'Publicacion no encontrada.', codigoHttp: 404 };

    const parsed = await this.parsearDatos(null, datos, existente, 'plataforma');
    if (parsed.error) return parsed;

    await this.blogRepo.actualizarPlataforma(id, parsed.datos);
    const fila = await this.blogRepo.buscarPlataformaPorId(id);
    return { publicacion: mapearPublicacionAdmin(fila, { deLaApp: true }) };
  }

  async eliminarPlataforma(id) {
    const borrada = await this.blogRepo.eliminarPlataforma(id);
    if (!borrada) return { error: 'Publicacion no encontrada.', codigoHttp: 404 };
    return { eliminada: true };
  }

  async parsearDatos(marcaId, datos, existente = null, ambito = 'marca') {
    const titulo = texto(datos.titulo ?? existente?.titulo, { capitalizar: 'inicio' });
    const contenido = datos.contenido ?? existente?.contenido ?? '';
    const extracto = datos.extracto !== undefined
      ? texto(datos.extracto) || null
      : existente?.extracto ?? null;
    const categoria = datos.categoria !== undefined
      ? texto(datos.categoria) || null
      : existente?.categoria ?? null;
    const imagenDestacada = normalizarRutaMediaAlmacenamiento(
      datos.imagen_destacada ?? datos.imagenDestacada ?? existente?.imagen_destacada ?? null
    );
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

    const excluirId = existente?.id ?? null;
    const slugOcupado = async (candidato) => {
      if (ambito === 'plataforma') return this.blogRepo.existeSlugPlataforma(candidato, excluirId);
      const enMarca = await this.blogRepo.existeSlug(marcaId, candidato, excluirId);
      if (enMarca) return true;
      return this.blogRepo.existeSlugPlataforma(candidato);
    };

    let slug = texto(datos.slug);
    if (!slug) {
      if (existente?.slug && (!datos.titulo || datos.titulo === existente.titulo)) {
        slug = existente.slug;
      } else {
        slug = await slugUnico(titulo, slugOcupado);
      }
    } else if (await slugOcupado(slug)) {
      return { error: 'El slug ya esta en uso.', codigoHttp: 409 };
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
