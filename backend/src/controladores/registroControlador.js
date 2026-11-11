import { registroMarcaServicio } from '../servicios/registroMarcaServicio.js';
import { respuestaExito, respuestaError } from '../utilidades/respuestaJson.js';

export async function registrarMarcaPublica(req, res) {
  const resultado = await registroMarcaServicio.registrar(req.body ?? {});
  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }
  return respuestaExito(res, resultado, 'Salon creado. Tienes 8 dias gratis.', 201);
}
