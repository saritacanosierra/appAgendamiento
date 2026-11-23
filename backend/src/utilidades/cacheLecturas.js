import { logger } from './logger.js';
import { marcarRedisCaido, obtenerClienteRedis } from './clienteRedis.js';

/**
 * Cache corta para lecturas publicas que se repiten.
 * La clave incluye el slug o el marca_id: dos tiendas no comparten entrada.
 * No guarda horarios: esos cambian con cada reserva.
 * Con REDIS_URL comparte cache entre instancias.
 */
export function crearCache({ ttlMs = 15_000, max = 400, prefijo = 'cache:pub' } = {}) {
  const mapa = new Map();

  function recortar() {
    while (mapa.size > max) {
      const primero = mapa.keys().next().value;
      mapa.delete(primero);
    }
  }

  async function desdeRedis(claveCompleta) {
    const redis = await obtenerClienteRedis();
    if (!redis) return null;
    try {
      const crudo = await redis.get(claveCompleta);
      if (!crudo) return null;
      return JSON.parse(crudo);
    } catch (err) {
      logger.warn({ err, clave: claveCompleta }, 'Cache Redis lectura fallida');
      marcarRedisCaido();
      return null;
    }
  }

  async function aRedis(claveCompleta, valor) {
    const redis = await obtenerClienteRedis();
    if (!redis) return;
    try {
      await redis.set(claveCompleta, JSON.stringify(valor), { PX: ttlMs });
    } catch (err) {
      logger.warn({ err, clave: claveCompleta }, 'Cache Redis escritura fallida');
      marcarRedisCaido();
    }
  }

  return {
    obtener(clave, cargar) {
      const ahora = Date.now();
      const previo = mapa.get(clave);

      if (previo && !previo.pendiente && previo.vence > ahora) {
        mapa.delete(clave);
        mapa.set(clave, previo);
        return Promise.resolve(previo.valor);
      }

      if (previo?.pendiente) return previo.pendiente;

      const claveRedis = `${prefijo}:${clave}`;

      const pendiente = Promise.resolve()
        .then(() => desdeRedis(claveRedis))
        .then((cacheado) => {
          if (cacheado !== null && cacheado !== undefined) return cacheado;
          return Promise.resolve().then(cargar);
        })
        .then(async (valor) => {
          mapa.delete(clave);
          mapa.set(clave, { valor, vence: Date.now() + ttlMs });
          recortar();
          await aRedis(claveRedis, valor);
          return valor;
        })
        .catch((error) => {
          const actual = mapa.get(clave);
          if (actual?.pendiente === pendiente) mapa.delete(clave);
          throw error;
        });

      mapa.set(clave, { pendiente, vence: 0 });
      return pendiente;
    },
  };
}

export const cacheLecturasPublicas = crearCache();
