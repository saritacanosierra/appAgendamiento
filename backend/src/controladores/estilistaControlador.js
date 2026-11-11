import { EstilistaServicio } from '../servicios/estilistaServicio.js';
import { MarcaRepositorio } from '../repositorios/index.js';
import { respuestaExito, respuestaError } from '../utilidades/respuestaJson.js';
import { entero } from '../utilidades/sanitizador.js';

const estilistaServicio = new EstilistaServicio();
const marcaRepo = new MarcaRepositorio();

export async function listarEstilistasPublicos(req, res) {
  const marcaId = entero(req.params.marca_id);
  if (!marcaId) return respuestaError(res, 'ID de marca invalido.', 422);

  const marca = await marcaRepo.buscarPorId(marcaId);
  if (!marca) return respuestaError(res, 'Marca no encontrada.', 404);

  const estilistas = await estilistaServicio.listarPublicos(marcaId);
  return respuestaExito(res, estilistas, 'Estilistas de la marca');
}

export async function listarPortafolioPublico(req, res) {
  const marcaId = entero(req.params.marca_id);
  if (!marcaId) return respuestaError(res, 'ID de marca invalido.', 422);

  const marca = await marcaRepo.buscarPorId(marcaId);
  if (!marca) return respuestaError(res, 'Marca no encontrada.', 404);

  const profesionales = await estilistaServicio.listarPortafolio(marcaId);
  return respuestaExito(res, profesionales, 'Portafolio del equipo');
}

export async function listarEstilistasAdmin(req, res) {
  const estilistas = await estilistaServicio.listarAdmin(req.marcaId);
  return respuestaExito(res, estilistas, 'Equipo de la marca');
}

export async function crearEstilistaAdmin(req, res) {
  const resultado = await estilistaServicio.crearAdmin(req.marcaId, req.body);
  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }
  return respuestaExito(res, resultado.estilista, 'Estilista creada', 201);
}

export async function actualizarEstilistaAdmin(req, res) {
  const id = entero(req.params.id);
  if (!id) return respuestaError(res, 'ID invalido.', 422);

  const resultado = await estilistaServicio.actualizarAdmin(req.marcaId, id, req.body);
  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }
  return respuestaExito(res, resultado.estilista, 'Estilista actualizada');
}
