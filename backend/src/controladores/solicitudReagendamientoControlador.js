import { respuestaExito, respuestaError } from '../utilidades/respuestaJson.js';
import { entero } from '../utilidades/sanitizador.js';
import { solicitudReagendamientoServicio } from '../servicios/solicitudReagendamientoServicio.js';

export async function listarSolicitudesReagendamiento(req, res) {
  const solicitudes = await solicitudReagendamientoServicio.listarPendientes(req.marcaId);
  return respuestaExito(res, solicitudes, 'Solicitudes de reagendamiento');
}

export async function aprobarSolicitudReagendamiento(req, res) {
  const id = entero(req.params.id);
  if (!id) return respuestaError(res, 'ID invalido.', 422);

  const resultado = await solicitudReagendamientoServicio.aprobar(req.marcaId, id);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400);
  }

  return respuestaExito(res, resultado.solicitud, 'Reagendamiento aprobado');
}

export async function rechazarSolicitudReagendamiento(req, res) {
  const id = entero(req.params.id);
  if (!id) return respuestaError(res, 'ID invalido.', 422);

  const resultado = await solicitudReagendamientoServicio.rechazar(req.marcaId, id);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400);
  }

  return respuestaExito(res, resultado.solicitud, 'Solicitud rechazada');
}
