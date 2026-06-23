import { respuestaError } from '../utilidades/respuestaJson.js';

export function superadminMiddleware(req, res, next) {
  if (req.usuario?.rol !== 'superadmin') {
    return respuestaError(res, 'Acceso reservado al administrador de plataforma.', 403);
  }
  next();
}

export function soloMarcaAdminMiddleware(req, res, next) {
  if (req.usuario?.rol === 'superadmin') {
    return respuestaError(res, 'Los superadministradores usan el panel /plataforma.', 403);
  }
  if (!req.marcaId) {
    return respuestaError(res, 'Sesion de marca invalida.', 403);
  }
  next();
}
