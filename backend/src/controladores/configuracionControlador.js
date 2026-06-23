import { ConfiguracionMarcaServicio } from '../servicios/configuracionMarcaServicio.js';
import { respuestaExito, respuestaError } from '../utilidades/respuestaJson.js';

const configServicio = new ConfiguracionMarcaServicio();

export async function obtenerAdmin(req, res) {
  const resultado = await configServicio.obtenerAdmin(req.marcaId);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 404);
  }

  return respuestaExito(res, resultado.configuracion, 'Configuracion de marca');
}

export async function actualizarAdmin(req, res) {
  const resultado = await configServicio.actualizarAdmin(req.marcaId, req.body);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }

  return respuestaExito(res, resultado.configuracion, 'Configuracion actualizada');
}

export async function subirArchivo(req, res) {
  return respuestaExito(res, { ruta: req.rutaSubida }, 'Archivo subido', 201);
}
