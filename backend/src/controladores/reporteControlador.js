import { reporteServicio } from '../servicios/reporteServicio.js';
import { respuestaExito, respuestaError } from '../utilidades/respuestaJson.js';
import { texto } from '../utilidades/sanitizador.js';

export async function obtenerReporte(req, res) {
  const desde = texto(req.query.desde) || undefined;
  const hasta = texto(req.query.hasta) || undefined;

  const resultado = await reporteServicio.obtenerReporte(req.marcaId, desde, hasta);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400);
  }

  return respuestaExito(res, resultado, 'Reporte del periodo');
}
