import { respuestaError } from '../utilidades/respuestaJson.js';
import { incrementarContadorTasa } from '../utilidades/contadorLimitadorTasa.js';

function obtenerIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'desconocida';
}

/**
 * Limitador por IP. Memoria en una instancia; Redis si REDIS_URL esta definido.
 */
export function limitarTasa({ ventanaMs = 60_000, max = 60, mensaje = 'Demasiadas solicitudes. Intenta mas tarde.' } = {}) {
  return async (req, res, next) => {
    try {
      const clave = `rl:${req.path}:${obtenerIp(req)}`;
      const conteo = await incrementarContadorTasa(clave, ventanaMs);

      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - conteo)));

      if (conteo > max) {
        return respuestaError(res, mensaje, 429);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

export const limitarLogin = limitarTasa({
  ventanaMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_LOGIN ?? 10),
  mensaje: 'Demasiados intentos de inicio de sesion. Espera 15 minutos.',
});

export const limitarReservas = limitarTasa({
  ventanaMs: 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_RESERVAS ?? 20),
  mensaje: 'Has superado el limite de reservas por hora. Intenta mas tarde.',
});

export const limitarConsultasReservas = limitarTasa({
  ventanaMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_CONSULTAS ?? 30),
  mensaje: 'Demasiadas consultas. Espera unos minutos e intenta de nuevo.',
});
