import { BlogServicio } from '../servicios/blogServicio.js';
import { MarcaRepositorio } from '../repositorios/index.js';
import { respuestaExito, respuestaError } from '../utilidades/respuestaJson.js';
import { entero, texto } from '../utilidades/sanitizador.js';

const blogServicio = new BlogServicio();
const marcaRepo = new MarcaRepositorio();

async function verificarMarcaPublica(marcaId, res) {
  const id = entero(marcaId);
  if (!id) {
    respuestaError(res, 'ID de marca invalido.', 422);
    return null;
  }

  const marca = await marcaRepo.buscarPorId(id);
  if (!marca) {
    respuestaError(res, 'Marca no encontrada.', 404);
    return null;
  }

  return id;
}

export async function listarPublicos(req, res) {
  const marcaId = await verificarMarcaPublica(req.params.marca_id, res);
  if (!marcaId) return;

  const publicaciones = await blogServicio.listarPublicos(marcaId);
  return respuestaExito(res, publicaciones, 'Publicaciones obtenidas');
}

export async function obtenerPublicoPorSlug(req, res) {
  const marcaId = await verificarMarcaPublica(req.params.marca_id, res);
  if (!marcaId) return;

  const slug = texto(req.params.slug);
  const resultado = await blogServicio.obtenerPublicoPorSlug(marcaId, slug);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 404);
  }

  return respuestaExito(res, resultado.publicacion, 'Publicacion obtenida');
}

export async function listarAdmin(req, res) {
  const publicaciones = await blogServicio.listarAdmin(req.marcaId);
  return respuestaExito(res, publicaciones, 'Publicaciones de la marca');
}

export async function crearAdmin(req, res) {
  const resultado = await blogServicio.crearAdmin(req.marcaId, req.body);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }

  return respuestaExito(res, resultado.publicacion, 'Publicacion creada', 201);
}

export async function actualizarAdmin(req, res) {
  const id = entero(req.params.id);
  if (!id) return respuestaError(res, 'ID invalido.', 422);

  const resultado = await blogServicio.actualizarAdmin(req.marcaId, id, req.body);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }

  return respuestaExito(res, resultado.publicacion, 'Publicacion actualizada');
}
