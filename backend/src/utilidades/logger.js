import pino from 'pino';
import { entorno } from '../configuracion/entorno.js';

const esProduccion = entorno.nodeEnv === 'produccion';

export const logger = pino({
  level: process.env.LOG_NIVEL ?? (esProduccion ? 'info' : 'debug'),
  timestamp: pino.stdTimeFunctions.isoTime,
  base: { servicio: 'spa-unas-api' },
  redact: {
    paths: ['req.headers.authorization', 'password', 'contrasena', 'token'],
    remove: true,
  },
});

/** Registra peticiones HTTP; en produccion solo advierte errores 4xx/5xx. */
export function registrarPeticiones(req, res, next) {
  const inicio = Date.now();

  res.on('finish', () => {
    const registro = {
      metodo: req.method,
      ruta: req.originalUrl,
      estado: res.statusCode,
      duracionMs: Date.now() - inicio,
    };

    if (res.statusCode >= 500) {
      logger.error(registro, 'peticion fallida');
    } else if (res.statusCode >= 400) {
      logger.warn(registro, 'peticion rechazada');
    } else if (!esProduccion) {
      logger.debug(registro, 'peticion');
    }
  });

  next();
}
