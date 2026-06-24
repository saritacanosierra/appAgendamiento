import { entorno } from '../configuracion/entorno.js';
import { respuestaError } from '../utilidades/respuestaJson.js';
import { logger } from '../utilidades/logger.js';

export function manejoErrores(err, req, res, next) {
  logger.error({
    err,
    metodo: req.method,
    ruta: req.originalUrl,
    marcaId: req.marcaId ?? null,
  }, err.message ?? 'Error interno');

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

function esHandlerExpress(valor) {
  return typeof valor === 'function';
}

/**
 * Envuelve todos los handlers registrados en el router para capturar rechazos async.
 */
export function parchearRouterAsync(router) {
  for (const metodo of ['get', 'post', 'put', 'delete', 'patch', 'use']) {
    const original = router[metodo].bind(router);
    router[metodo] = (...args) => {
      const envueltos = args.map((arg) => (esHandlerExpress(arg) ? capturarAsync(arg) : arg));
      return original(...envueltos);
    };
  }
  return router;
}
