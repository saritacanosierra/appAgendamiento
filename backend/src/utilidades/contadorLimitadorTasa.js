import { logger } from './logger.js';
import { marcarRedisCaido, obtenerClienteRedis } from './clienteRedis.js';

const registrosMemoria = new Map();

function podarMemoria(ahora) {
  if (registrosMemoria.size < 200) return;
  for (const [clave, datos] of registrosMemoria) {
    if (ahora - datos.inicio > 60 * 60 * 1000) registrosMemoria.delete(clave);
  }
}

function incrementarMemoria(clave, ventanaMs) {
  const ahora = Date.now();
  podarMemoria(ahora);
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
  const redis = await obtenerClienteRedis();
  if (redis) {
    try {
      return await incrementarRedis(redis, clave, ventanaMs);
    } catch (err) {
      logger.warn({ err, clave }, 'Fallo Redis; fallback a memoria');
      marcarRedisCaido();
    }
  }
  return incrementarMemoria(clave, ventanaMs);
}
