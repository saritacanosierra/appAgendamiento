import bcrypt from 'bcrypt';
import crypto from 'crypto';
import {
  UsuarioRepositorio,
  TokenRepositorio,
  MarcaRepositorio,
} from '../repositorios/index.js';
import { entorno } from '../configuracion/entorno.js';
import { mapearMarcaPublica } from './marcaServicio.js';
import { verificarMarcaOperativa } from '../utilidades/marcaOperativa.js';

const HORAS_EXPIRACION = Number(process.env.TOKEN_EXPIRACION_HORAS ?? 168);
const HORAS_ROTACION = Number(process.env.TOKEN_ROTACION_HORAS ?? 24);

export class AutenticacionServicio {
  constructor(
    usuarioRepo = new UsuarioRepositorio(),
    tokenRepo = new TokenRepositorio(),
    marcaRepo = new MarcaRepositorio(),
    seguridad = new SeguridadServicio()
  ) {
    this.usuarioRepo = usuarioRepo;
    this.tokenRepo = tokenRepo;
    this.marcaRepo = marcaRepo;
    this.seguridad = seguridad;
  }

  async verificarCredenciales(correo, contrasena) {
    const usuario = await this.usuarioRepo.buscarPorCorreo(correo);
    if (!usuario) return null;

    const valida = await bcrypt.compare(contrasena, usuario.contrasena_hash);
    return valida ? usuario : null;
  }

  async iniciarSesion(correo, contrasena) {
    const usuario = await this.verificarCredenciales(correo, contrasena);
    if (!usuario) {
      return { error: 'Credenciales invalidas.' };
    }

    if (usuario.rol !== 'superadmin') {
      const marca = await this.marcaRepo.buscarPorIdCompleto(usuario.marca_id);
      const operativa = verificarMarcaOperativa(marca);
      if (!operativa.ok) {
        return { error: operativa.error, codigoHttp: operativa.codigoHttp };
      }
    }

    return this.crearSesionParaUsuario(usuario);
  }

  async crearSesionParaUsuario(usuario) {
    const token = this.seguridad.generarToken();
    const tokenHash = this.seguridad.hashToken(token);
    const expiraEn = new Date(Date.now() + HORAS_EXPIRACION * 60 * 60 * 1000);

    await this.tokenRepo.crear({
      usuarioId: usuario.id,
      marcaId: usuario.marca_id ?? null,
      tokenHash,
      expiraEn,
    });

    await this.usuarioRepo.actualizarUltimoAcceso(usuario.id);

    if (usuario.rol === 'superadmin') {
      return {
        token,
        expiraEn: expiraEn.toISOString(),
        usuario: {
          id: usuario.id,
          marcaId: null,
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: usuario.rol,
        },
        marca: null,
      };
    }

    const marcaFila = await this.marcaRepo.buscarPorIdCompleto(usuario.marca_id);
    const marca = mapearMarcaPublica(marcaFila);

    return {
      token,
      expiraEn: expiraEn.toISOString(),
      usuario: {
        id: usuario.id,
        marcaId: usuario.marca_id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
      marca,
    };
  }

  async validarToken(token) {
    if (!token) return null;
    const tokenHash = this.seguridad.hashToken(token);
    const sesion = await this.tokenRepo.buscarValido(tokenHash);
    if (!sesion) return null;

    return {
      usuarioId: sesion.usuario_id,
      marcaId: sesion.marca_id,
      nombre: sesion.usuario_nombre,
      correo: sesion.usuario_correo,
      rol: sesion.usuario_rol,
      tokenHash,
      creadoEn: sesion.created_at,
    };
  }

  debeRotarToken(sesion) {
    if (!sesion?.creadoEn) return false;
    const creado = new Date(sesion.creadoEn).getTime();
    const horasTranscurridas = (Date.now() - creado) / (1000 * 60 * 60);
    return horasTranscurridas >= HORAS_ROTACION;
  }

  async rotarToken(token) {
    const sesion = await this.validarToken(token);
    if (!sesion) {
      return { error: 'Sesion invalida o expirada.' };
    }

    const nuevoToken = this.seguridad.generarToken();
    const nuevoHash = this.seguridad.hashToken(nuevoToken);
    const expiraEn = new Date(Date.now() + HORAS_EXPIRACION * 60 * 60 * 1000);

    await this.tokenRepo.revocar(sesion.tokenHash);
    await this.tokenRepo.crear({
      usuarioId: sesion.usuarioId,
      marcaId: sesion.marcaId,
      tokenHash: nuevoHash,
      expiraEn,
    });

    return {
      token: nuevoToken,
      expiraEn: expiraEn.toISOString(),
    };
  }

  async rotarTokenSiNecesario(token) {
    const sesion = await this.validarToken(token);
    if (!sesion || !this.debeRotarToken(sesion)) {
      return null;
    }
    return this.rotarToken(token);
  }

  async cerrarSesion(token) {
    if (!token) return;
    const tokenHash = this.seguridad.hashToken(token);
    await this.tokenRepo.revocar(tokenHash);
  }

  async obtenerSesionCompleta(token) {
    const sesion = await this.validarToken(token);
    if (!sesion) return null;

    const usuario = await this.usuarioRepo.buscarPorId(sesion.usuarioId);
    if (!usuario) return null;

    if (usuario.rol === 'superadmin') {
      return {
        usuario: {
          id: usuario.id,
          marcaId: null,
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: usuario.rol,
        },
        marca: null,
      };
    }

    const marcaFila = await this.marcaRepo.buscarPorId(sesion.marcaId);

    return {
      usuario: {
        id: usuario.id,
        marcaId: usuario.marca_id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
      marca: mapearMarcaPublica(marcaFila),
    };
  }

  async hashContrasena(contrasena) {
    return bcrypt.hash(contrasena, 10);
  }
}

export class SeguridadServicio {
  generarToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export { CalendarioServicio } from './calendarioServicio.js';
export { NotificacionServicio, notificacionServicio } from './notificacionServicio.js';
