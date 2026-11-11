import { PublicidadRepositorio } from '../repositorios/publicidadRepositorio.js';
import { entero, texto } from '../utilidades/sanitizador.js';
import { requerido, validar } from '../utilidades/validador.js';

function idsDeFila(fila) {
  if (!fila?.publicacion_ids) return [];
  return String(fila.publicacion_ids)
    .split(',')
    .map((id) => Number(id))
    .filter((id) => id > 0);
}

function mapear(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    anunciante: fila.anunciante,
    titulo: fila.titulo,
    tipo: fila.tipo === 'imagen' ? 'imagen' : 'enlace',
    texto: fila.texto,
    imagen: fila.imagen_ruta,
    enlaceUrl: fila.enlace_url,
    activa: Boolean(fila.activa),
    orden: fila.orden_visualizacion,
    publicacionIds: idsDeFila(fila),
  };
}

function enlaceSeguro(valor) {
  const url = texto(valor);
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) return { invalido: true };
  return url.slice(0, 500);
}

function leerIds(entrada) {
  const crudo = entrada.publicacion_ids ?? entrada.publicacionIds ?? [];
  const lista = Array.isArray(crudo) ? crudo : [crudo];
  return [...new Set(lista.map((id) => entero(id)).filter((id) => id > 0))];
}

function leerDatos(entrada, anterior = null) {
  const anunciante = texto(entrada.anunciante, { capitalizar: 'palabras' });
  const titulo = texto(entrada.titulo);
  const tipo = entrada.tipo === 'imagen' ? 'imagen' : 'enlace';
  const cuerpo = texto(entrada.texto);
  const imagen = texto(entrada.imagen ?? entrada.imagen_ruta ?? entrada.imagenRuta) || anterior?.imagen_ruta || null;
  const enlace = enlaceSeguro(entrada.enlace_url ?? entrada.enlaceUrl);
  const activa = entrada.activa === undefined ? true : Boolean(entrada.activa);
  const orden = entero(entrada.orden ?? entrada.orden_visualizacion) || 0;
  const publicacionIds = leerIds(entrada);

  return { anunciante, titulo, tipo, texto: cuerpo || null, imagenRuta: imagen, enlace, activa, orden, publicacionIds };
}

export class PublicidadServicio {
  constructor(repo = new PublicidadRepositorio()) {
    this.repo = repo;
  }

  async listarPorPublicacion(publicacionId) {
    if (!publicacionId) return [];
    const filas = await this.repo.listarActivasPorPublicacion(publicacionId);
    return filas.map(mapear);
  }

  async listarAdmin() {
    const filas = await this.repo.listarTodas();
    return filas.map(mapear);
  }

  async listarPublicaciones() {
    const filas = await this.repo.listarPublicacionesElegibles();
    return filas.map((fila) => ({
      id: fila.id,
      titulo: fila.titulo,
      estado: fila.estado,
      marcaNombre: fila.marca_nombre,
    }));
  }

  async validar(datos, anterior) {
    if (datos.enlace?.invalido) {
      return { error: 'El enlace debe empezar por http:// o https://.', codigoHttp: 422 };
    }
    if (!datos.enlace) {
      return { error: 'El enlace es obligatorio.', codigoHttp: 422 };
    }
    if (datos.tipo === 'imagen' && !datos.imagenRuta) {
      return { error: 'La campana de imagen necesita una foto.', codigoHttp: 422 };
    }
    if (!datos.publicacionIds.length) {
      return { error: 'Elige al menos una publicacion.', codigoHttp: 422 };
    }

    const errores = validar(
      { anunciante: datos.anunciante, titulo: datos.titulo },
      {
        anunciante: (v) => requerido(v, 'anunciante'),
        titulo: (v) => requerido(v, 'titulo'),
      }
    );
    if (Object.keys(errores).length > 0) {
      return { error: 'Datos invalidos.', errores, codigoHttp: 422 };
    }

    const existentes = await this.repo.filtrarPublicacionesExistentes(datos.publicacionIds);
    if (existentes.length !== datos.publicacionIds.length) {
      return { error: 'Hay una publicacion que no existe.', codigoHttp: 422 };
    }

    return { datos: { ...datos, enlaceUrl: datos.enlace, imagenRuta: datos.imagenRuta || anterior?.imagen_ruta || null } };
  }

  async crear(entrada) {
    const leido = leerDatos(entrada);
    const validado = await this.validar(leido);
    if (validado.error) return validado;

    const id = await this.repo.crear(validado.datos);
    await this.repo.reemplazarPublicaciones(id, validado.datos.publicacionIds);
    return { anuncio: mapear(await this.repo.buscarPorId(id)) };
  }

  async actualizar(id, entrada) {
    const anterior = await this.repo.buscarPorId(id);
    if (!anterior) return { error: 'Anuncio no encontrado.', codigoHttp: 404 };

    const leido = leerDatos(entrada, anterior);
    const validado = await this.validar(leido, anterior);
    if (validado.error) return validado;

    await this.repo.actualizar(id, validado.datos);
    await this.repo.reemplazarPublicaciones(id, validado.datos.publicacionIds);
    return { anuncio: mapear(await this.repo.buscarPorId(id)) };
  }
}

export const publicidadServicio = new PublicidadServicio();
