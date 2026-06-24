import { authServicio, extraerToken } from '../controladores/autenticacionControlador.js';
import { MarcaRepositorio, UsuarioRepositorio } from '../repositorios/index.js';
import { mapearMarcaPublica } from '../servicios/marcaServicio.js';
import { verificarMarcaOperativa } from '../utilidades/marcaOperativa.js';
import { respuestaError } from '../utilidades/respuestaJson.js';
import { entorno } from '../configuracion/entorno.js';

const marcaRepo = new MarcaRepositorio();
const usuarioRepo = new UsuarioRepositorio();

const ROLES_MARCA = new Set(['admin', 'staff']);

export async function autenticacionMiddleware(req, res, next) {
  try {
    const token = extraerToken(req);
    const sesion = await authServicio.validarToken(token);

    if (!sesion) {
      return respuestaError(res, 'Autenticacion requerida o sesion expirada.', 401);
    }

    const usuarioDb = await usuarioRepo.buscarPorId(sesion.usuarioId);
    if (!usuarioDb?.activo) {
      return respuestaError(res, 'Autenticacion requerida o sesion expirada.', 401);
    }

    if (usuarioDb.rol === 'superadmin') {
      if (!entorno.plataformaHabilitada) {
        const esLogout = req.originalUrl?.includes('/auth/logout');
        if (!esLogout) {
          return respuestaError(res, 'Autenticacion requerida o sesion expirada.', 401);
        }
      }

      req.usuario = {
        id: usuarioDb.id,
        marcaId: null,
        nombre: usuarioDb.nombre,
        correo: usuarioDb.correo,
        rol: usuarioDb.rol,
      };
      req.marcaId = null;
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

    if (!ROLES_MARCA.has(usuarioDb.rol)) {
      return respuestaError(res, 'Acceso denegado.', 403);
    }

    if (Number(usuarioDb.marca_id) !== Number(sesion.marcaId)) {
      return respuestaError(res, 'Autenticacion requerida o sesion expirada.', 401);
    }

    req.usuario = {
      id: usuarioDb.id,
      marcaId: usuarioDb.marca_id,
      nombre: usuarioDb.nombre,
      correo: usuarioDb.correo,
      rol: usuarioDb.rol,
    };
    req.marcaId = usuarioDb.marca_id;

    const marcaFila = await marcaRepo.buscarPorIdCompleto(usuarioDb.marca_id);
    const operativa = verificarMarcaOperativa(marcaFila);
    if (!operativa.ok) {
      const esLogout = req.originalUrl?.includes('/auth/logout');
      if (!esLogout) {
        return respuestaError(res, operativa.error, operativa.codigoHttp);
      }
    }

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
    respuestaError(res, 'Acceso denegado.', 403);
    return false;
  }
  return true;
}
