import { createClient } from 'redis';
import { logger } from './logger.js';

let clienteRedis;
let redisDisponible = false;
let redisIntentado = false;

/** Cliente Redis compartido (rate limit, cache). Null si no hay REDIS_URL o falló. */
export async function obtenerClienteRedis() {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;

  if (!redisIntentado) {
    redisIntentado = true;
    try {
      clienteRedis = createClient({ url });
      clienteRedis.on('error', (err) => {
        logger.warn({ err }, 'Redis desconectado');
        redisDisponible = false;
      });
      await clienteRedis.connect();
      redisDisponible = true;
      logger.info('Redis conectado');
    } catch (err) {
      logger.warn({ err }, 'Redis no disponible; se usa memoria local');
      redisDisponible = false;
    }
  }

  return redisDisponible ? clienteRedis : null;
}

export function redisEstaDisponible() {
  return redisDisponible;
}

export function marcarRedisCaido() {
  redisDisponible = false;
}
