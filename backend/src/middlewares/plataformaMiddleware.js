import { respuestaError } from '../utilidades/respuestaJson.js';
import { entorno } from '../configuracion/entorno.js';

export function plataformaDisponibleMiddleware(req, res, next) {
  if (!entorno.plataformaHabilitada) {
    return respuestaError(res, 'Recurso no encontrado.', 404);
  }
  next();
}

export function superadminMiddleware(req, res, next) {
  if (req.usuario?.rol !== 'superadmin') {
    return respuestaError(res, 'Acceso denegado.', 403);
  }
  next();
}

const ROLES_PANEL_MARCA = new Set(['admin', 'staff']);

export function soloMarcaAdminMiddleware(req, res, next) {
  const rol = req.usuario?.rol;

  if (rol === 'superadmin') {
    return respuestaError(res, 'Acceso denegado.', 403);
  }

  if (!ROLES_PANEL_MARCA.has(rol)) {
    return respuestaError(res, 'Acceso denegado.', 403);
  }

  if (!req.marcaId) {
    return respuestaError(res, 'Acceso denegado.', 403);
  }

  next();
}
