import { MarcaRepositorio, ServicioRepositorio } from '../repositorios/index.js';
import { ServicioServicio } from '../servicios/marcaServicio.js';
import { respuestaExito, respuestaError } from '../utilidades/respuestaJson.js';
import { entero } from '../utilidades/sanitizador.js';

const marcaRepo = new MarcaRepositorio();
const servicioServicio = new ServicioServicio(new ServicioRepositorio());

export async function listarPublicos(req, res) {
  const marcaId = entero(req.params.marca_id);

  if (!marcaId) {
    return respuestaError(res, 'ID de marca invalido.', 422);
  }

  const marca = await marcaRepo.buscarPorId(marcaId);
  if (!marca) {
    return respuestaError(res, 'Marca no encontrada.', 404);
  }

  const servicios = await servicioServicio.listarPublicos(marcaId);
  return respuestaExito(res, servicios, 'Servicios obtenidos');
}

export async function listarAdmin(req, res) {
  const servicios = await servicioServicio.listarAdmin(req.marcaId);
  return respuestaExito(res, servicios, 'Servicios de la marca');
}

export async function crearAdmin(req, res) {
  const resultado = await servicioServicio.crearAdmin(req.marcaId, req.body);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }

  return respuestaExito(res, resultado.servicio, 'Servicio creado', 201);
}

export async function actualizarAdmin(req, res) {
  const servicioId = entero(req.params.id);
  if (!servicioId) return respuestaError(res, 'ID invalido.', 422);

  const resultado = await servicioServicio.actualizarAdmin(req.marcaId, servicioId, req.body);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }

  return respuestaExito(res, resultado.servicio, 'Servicio actualizado');
}
