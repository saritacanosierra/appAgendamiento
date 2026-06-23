import { AutenticacionServicio } from '../servicios/index.js';
import { respuestaExito, respuestaError } from '../utilidades/respuestaJson.js';
import { texto } from '../utilidades/sanitizador.js';
import { requerido, email, validar } from '../utilidades/validador.js';
import { registrarAuditoria } from '../utilidades/auditoria.js';

const authServicio = new AutenticacionServicio();

export async function login(req, res) {
  const correo = texto(req.body?.correo);
  const contrasena = req.body?.contrasena ?? '';

  const errores = validar(
    { correo, contrasena },
    {
      correo: (v) => requerido(v, 'correo') ?? email(v),
      contrasena: (v) => requerido(v, 'contrasena'),
    }
  );

  if (Object.keys(errores).length > 0) {
    return respuestaError(res, 'Datos invalidos.', 422, errores);
  }

  const resultado = await authServicio.iniciarSesion(correo, contrasena);

  if (resultado.error) {
    registrarAuditoria('login_fallido', { ip: req.ip, correo });
    return respuestaError(res, resultado.error, 401);
  }

  registrarAuditoria('login_exitoso', {
    ip: req.ip,
    usuarioId: resultado.usuario.id,
    marcaId: resultado.usuario.marcaId,
  });

  return respuestaExito(res, {
    token: resultado.token,
    expiraEn: resultado.expiraEn,
    usuario: resultado.usuario,
    marca: resultado.marca,
  }, 'Sesion iniciada');
}

export async function logout(req, res) {
  const token = extraerToken(req);
  await authServicio.cerrarSesion(token);
  return respuestaExito(res, null, 'Sesion cerrada');
}

export async function me(req, res) {
  return respuestaExito(res, {
    usuario: req.usuario,
    marca: req.marca,
  }, 'Sesion activa');
}

export async function rotarToken(req, res) {
  const token = extraerToken(req);
  const resultado = await authServicio.rotarToken(token);

  if (resultado.error) {
    return respuestaError(res, resultado.error, 401);
  }

  res.setHeader('X-Nuevo-Token', resultado.token);
  res.setHeader('X-Token-Expira', resultado.expiraEn);

  return respuestaExito(res, {
    token: resultado.token,
    expiraEn: resultado.expiraEn,
  }, 'Token renovado');
}

export function extraerToken(req) {
  const cabecera = req.headers.authorization ?? '';
  if (cabecera.startsWith('Bearer ')) {
    return cabecera.slice(7).trim();
  }
  return null;
}

export { authServicio };
