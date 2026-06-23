import { notificacionServicio } from '../servicios/notificacionServicio.js';
import { respuestaExito, respuestaError } from '../utilidades/respuestaJson.js';
import { entero, booleano } from '../utilidades/sanitizador.js';

export async function obtenerResumen(req, res) {
  const resumen = await notificacionServicio.resumen(req.marcaId);
  return respuestaExito(res, resumen, 'Resumen de notificaciones');
}

export async function listarNotificaciones(req, res) {
  const soloNoLeidas = booleano(req.query.solo_no_leidas ?? req.query.soloNoLeidas);
  const limite = entero(req.query.limite) ?? 50;
  const notificaciones = await notificacionServicio.listar(req.marcaId, { soloNoLeidas, limite });
  return respuestaExito(res, notificaciones, 'Notificaciones');
}

export async function marcarLeida(req, res) {
  const id = entero(req.params.id);
  if (!id) return respuestaError(res, 'ID invalido.', 422);

  const resultado = await notificacionServicio.marcarLeida(req.marcaId, id);
  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 404);
  }

  return respuestaExito(res, resultado.notificacion, 'Notificacion marcada como leida');
}

export async function marcarTodasLeidas(req, res) {
  await notificacionServicio.marcarTodasLeidas(req.marcaId);
  return respuestaExito(res, null, 'Todas las notificaciones marcadas como leidas');
}
