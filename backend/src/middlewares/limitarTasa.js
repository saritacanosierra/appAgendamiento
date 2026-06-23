import { respuestaError } from '../utilidades/respuestaJson.js';

const registros = new Map();

function limpiarExpirados(ventanaMs) {
  const ahora = Date.now();
  for (const [clave, datos] of registros.entries()) {
    if (ahora - datos.inicio > ventanaMs) {
      registros.delete(clave);
    }
  }
}

function obtenerIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'desconocida';
}

/**
 * Limitador en memoria por IP. Adecuado para desarrollo y una instancia.
 */
export function limitarTasa({ ventanaMs = 60_000, max = 60, mensaje = 'Demasiadas solicitudes. Intenta mas tarde.' } = {}) {
  return (req, res, next) => {
    limpiarExpirados(ventanaMs);

    const clave = `${req.path}:${obtenerIp(req)}`;
    const ahora = Date.now();
    let datos = registros.get(clave);

    if (!datos || ahora - datos.inicio > ventanaMs) {
      datos = { inicio: ahora, conteo: 0 };
      registros.set(clave, datos);
    }

    datos.conteo += 1;

    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - datos.conteo)));

    if (datos.conteo > max) {
      return respuestaError(res, mensaje, 429);
    }

    next();
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
