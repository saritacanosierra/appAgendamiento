import { publicidadServicio } from '../servicios/publicidadServicio.js';
import { respuestaExito, respuestaError } from '../utilidades/respuestaJson.js';
import { entero } from '../utilidades/sanitizador.js';

export async function listarPublicidadPublica(req, res) {
  const publicacionId = entero(req.query.publicacion_id);
  const anuncios = await publicidadServicio.listarPorPublicacion(publicacionId);
  return respuestaExito(res, { anuncios }, 'Publicidad de la publicacion');
}

export async function listarPublicacionesParaPublicidad(_req, res) {
  const publicaciones = await publicidadServicio.listarPublicaciones();
  return respuestaExito(res, { publicaciones }, 'Publicaciones para asignar publicidad');
}

export async function listarPublicidadPlataforma(_req, res) {
  const anuncios = await publicidadServicio.listarAdmin();
  return respuestaExito(res, { anuncios }, 'Publicidad de la plataforma');
}

export async function crearPublicidadPlataforma(req, res) {
  const resultado = await publicidadServicio.crear(req.body);
  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }
  return respuestaExito(res, resultado, 'Anuncio creado', 201);
}

export async function actualizarPublicidadPlataforma(req, res) {
  const id = entero(req.params.id);
  const resultado = await publicidadServicio.actualizar(id, req.body);
  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }
  return respuestaExito(res, resultado, 'Anuncio actualizado');
}
