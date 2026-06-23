import { authServicio, extraerToken } from '../controladores/autenticacionControlador.js';
import { MarcaRepositorio } from '../repositorios/index.js';
import { mapearMarcaPublica } from '../servicios/marcaServicio.js';
import { respuestaError } from '../utilidades/respuestaJson.js';

const marcaRepo = new MarcaRepositorio();

export async function autenticacionMiddleware(req, res, next) {
  try {
    const token = extraerToken(req);
    const sesion = await authServicio.validarToken(token);

    if (!sesion) {
      return respuestaError(res, 'Autenticacion requerida o sesion expirada.', 401);
    }

    req.usuario = {
      id: sesion.usuarioId,
      marcaId: sesion.marcaId ?? null,
      nombre: sesion.nombre,
      correo: sesion.correo,
      rol: sesion.rol,
    };
    req.marcaId = sesion.marcaId ?? null;

    if (sesion.rol === 'superadmin') {
      req.marca = null;
      req.token = token;

      const esRotacionExplicita = req.originalUrl?.includes('/auth/rotar');
      if (!esRotacionExplicita) {
        const rotacion = await authServicio.rotarTokenSiNecesario(token);
        if (rotacion) {
          res.setHeader('X-Nuevo-Token', rotacion.token);
          res.setHeader('X-Token-Expira', rotacion.expiraEn);
          req.token = rotacion.token;
        }
      }

      return next();
    }

    const marcaFila = await marcaRepo.buscarPorId(sesion.marcaId);
    req.marca = mapearMarcaPublica(marcaFila);
    req.token = token;

    const esRotacionExplicita = req.originalUrl?.includes('/auth/rotar');
    if (!esRotacionExplicita) {
      const rotacion = await authServicio.rotarTokenSiNecesario(token);
      if (rotacion) {
        res.setHeader('X-Nuevo-Token', rotacion.token);
        res.setHeader('X-Token-Expira', rotacion.expiraEn);
        req.token = rotacion.token;
      }
    }

    next();
  } catch (err) {
    next(err);
  }
}

export function obtenerMarcaIdAutenticada(req) {
  return req.marcaId ?? 0;
}

export function verificarAccesoMarca(req, res, marcaId) {
  const marcaAutenticada = obtenerMarcaIdAutenticada(req);
  if (marcaAutenticada === 0 || marcaAutenticada !== marcaId) {
    respuestaError(res, 'Acceso denegado a los datos de esta marca.', 403);
    return false;
  }
  return true;
}
