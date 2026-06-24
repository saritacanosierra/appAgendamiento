import { createClient } from 'redis';
import { logger } from './logger.js';

const registrosMemoria = new Map();
let clienteRedis;
let redisDisponible = false;
let redisIntentado = false;

async function obtenerRedis() {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;

  if (!redisIntentado) {
    redisIntentado = true;
    try {
      clienteRedis = createClient({ url });
      clienteRedis.on('error', (err) => {
        logger.warn({ err }, 'Redis rate limit desconectado');
        redisDisponible = false;
      });
      await clienteRedis.connect();
      redisDisponible = true;
      logger.info('Rate limit usando Redis');
    } catch (err) {
      logger.warn({ err }, 'Redis no disponible; rate limit en memoria');
      redisDisponible = false;
    }
  }

  return redisDisponible ? clienteRedis : null;
}

function incrementarMemoria(clave, ventanaMs) {
  const ahora = Date.now();
  let datos = registrosMemoria.get(clave);

  if (!datos || ahora - datos.inicio > ventanaMs) {
    datos = { inicio: ahora, conteo: 0 };
    registrosMemoria.set(clave, datos);
  }

  datos.conteo += 1;
  return datos.conteo;
}

async function incrementarRedis(cliente, clave, ventanaMs) {
  const contador = await cliente.incr(clave);
  if (contador === 1) {
    await cliente.pExpire(clave, ventanaMs);
  }
  return contador;
}

/** Incrementa contador por clave; usa Redis si REDIS_URL esta configurado. */
export async function incrementarContadorTasa(clave, ventanaMs) {
  const redis = await obtenerRedis();
  if (redis) {
    try {
      return await incrementarRedis(redis, clave, ventanaMs);
    } catch (err) {
      logger.warn({ err, clave }, 'Fallo Redis; fallback a memoria');
      redisDisponible = false;
    }
  }
  return incrementarMemoria(clave, ventanaMs);
}
