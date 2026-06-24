import { entorno } from '../configuracion/entorno.js';
import { respuestaError } from '../utilidades/respuestaJson.js';

export function manejoErrores(err, req, res, next) {
  console.error('[API Error]', err);

  const mensaje = entorno.depuracion
    ? err.message ?? 'Error interno del servidor.'
    : 'Error interno del servidor.';

  respuestaError(res, mensaje, err.codigoHttp ?? 500);
}

export function rutaNoEncontrada(req, res) {
  respuestaError(res, 'Ruta no encontrada.', 404);
}

/** Evita que un error async tumbe todo el proceso de Node. */
export function capturarAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
