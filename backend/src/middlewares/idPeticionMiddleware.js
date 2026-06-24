import crypto from 'crypto';
import { logger } from '../utilidades/logger.js';

/** Asigna X-Request-Id para correlacionar logs de una misma peticion. */
export function idPeticionMiddleware(req, res, next) {
  const id = req.headers['x-request-id']?.trim() || crypto.randomUUID();
  req.idPeticion = id;
  req.log = logger.child({ requestId: id });
  res.setHeader('X-Request-Id', id);
  next();
}
