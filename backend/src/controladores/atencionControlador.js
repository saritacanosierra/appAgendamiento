import { atencionServicio } from '../servicios/atencionServicio.js';
import { respuestaExito, respuestaError } from '../utilidades/respuestaJson.js';
import { entero, texto } from '../utilidades/sanitizador.js';

export async function listarCitasAtencion(req, res) {
  const fecha = texto(req.query.fecha) || undefined;
  const resultado = await atencionServicio.listarCitasAtencion(req.marcaId, fecha);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400);
  }

  return respuestaExito(res, resultado, 'Citas para atencion');
}

export async function cerrarServicioAtencion(req, res) {
  const citaId = entero(req.params.id);
  if (!citaId) return respuestaError(res, 'ID invalido.', 422);

  const resultado = await atencionServicio.cerrarServicio(req.marcaId, citaId, req.body);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400);
  }

  return respuestaExito(res, resultado.cita, 'Servicio confirmado y facturado');
}
