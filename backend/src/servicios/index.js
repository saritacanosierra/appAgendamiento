import bcrypt from 'bcrypt';
import crypto from 'crypto';
import {
  UsuarioRepositorio,
  TokenRepositorio,
  MarcaRepositorio,
} from '../repositorios/index.js';
import { RecuperacionContrasenaRepositorio } from '../repositorios/recuperacionContrasenaRepositorio.js';
import { emailServicio } from './emailServicio.js';
import { entorno } from '../configuracion/entorno.js';
import { mapearMarcaPublica } from './marcaServicio.js';
import { planSePuedePagar, verificarMarcaOperativa } from '../utilidades/marcaOperativa.js';
import { mapearEstadoSuscripcion } from '../utilidades/suscripcionMarca.js';
import { email as validarEmail } from '../utilidades/validador.js';

const HORAS_EXPIRACION = Number(process.env.TOKEN_EXPIRACION_HORAS ?? 168);
const HORAS_ROTACION = Number(process.env.TOKEN_ROTACION_HORAS ?? 24);
const MINUTOS_RECUPERACION = 60;
const MENSAJE_RECUPERACION = 'Si el correo y el celular coinciden, enviamos un enlace a ese correo para cambiar la contrasena.';
const MENSAJE_NO_COINCIDEN = 'El correo y el celular no coinciden. No enviamos nada y la contrasena no cambio.';

function celularCoincide(ingresado, guardado) {
  const a = String(ingresado ?? '').replace(/\D+/g, '');
  const b = String(guardado ?? '').replace(/\D+/g, '');
  if (a.length < 10 || b.length < 10) return false;
  return a.slice(-10) === b.slice(-10);
}

export class AutenticacionServicio {
  constructor(
    usuarioRepo = new UsuarioRepositorio(),
    tokenRepo = new TokenRepositorio(),
    marcaRepo = new MarcaRepositorio(),
    seguridad = new SeguridadServicio(),
    recuperacionRepo = new RecuperacionContrasenaRepositorio(),
    correoServicio = emailServicio
  ) {
    this.usuarioRepo = usuarioRepo;
    this.tokenRepo = tokenRepo;
    this.marcaRepo = marcaRepo;
    this.seguridad = seguridad;
    this.recuperacionRepo = recuperacionRepo;
    this.correoServicio = correoServicio;
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

    if (usuario.rol === 'superadmin' && !entorno.plataformaHabilitada) {
      return { error: 'Credenciales invalidas.' };
    }

    if (!['superadmin', 'admin', 'staff'].includes(usuario.rol)) {
      return { error: 'Credenciales invalidas.' };
    }

    if (usuario.rol !== 'superadmin') {
      const marca = await this.marcaRepo.buscarPorIdCompleto(usuario.marca_id);
      const operativa = verificarMarcaOperativa(marca);
      if (!operativa.ok && !planSePuedePagar(marca, operativa)) {
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
    const marca = {
      ...mapearMarcaPublica(marcaFila),
      plan: mapearEstadoSuscripcion(marcaFila),
    };

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
      marca: {
        ...mapearMarcaPublica(marcaFila),
        plan: mapearEstadoSuscripcion(marcaFila),
      },
    };
  }

  async hashContrasena(contrasena) {
    return bcrypt.hash(contrasena, 10);
  }

  mapearUsuarioPublico(usuario) {
    return {
      id: usuario.id,
      marcaId: usuario.marca_id ?? null,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
    };
  }

  async obtenerPerfil(usuarioId) {
    const usuario = await this.usuarioRepo.buscarPorId(usuarioId);
    if (!usuario) {
      return { error: 'Usuario no encontrado.', codigoHttp: 404 };
    }
    return { usuario: this.mapearUsuarioPublico(usuario) };
  }

  /**
   * Actualiza nombre/correo del usuario autenticado.
   * Si envia contrasenaNueva, exige contrasenaActual y cierra otras sesiones.
   */
  async actualizarPerfil(usuarioId, datos, tokenActual = null) {
    const usuario = await this.usuarioRepo.buscarPorIdConHash(usuarioId);
    if (!usuario) {
      return { error: 'Usuario no encontrado.', codigoHttp: 404 };
    }

    const nombre = String(datos.nombre ?? usuario.nombre).trim();
    const correo = String(datos.correo ?? usuario.correo).trim().toLowerCase();
    const contrasenaActual = datos.contrasenaActual ?? datos.contrasena_actual ?? '';
    const contrasenaNueva = datos.contrasenaNueva ?? datos.contrasena_nueva ?? '';
    const errores = {};

    if (!nombre || nombre.length < 2) {
      errores.nombre = 'Escribe tu nombre (minimo 2 caracteres).';
    } else if (nombre.length > 120) {
      errores.nombre = 'El nombre no puede superar 120 caracteres.';
    }

    if (!correo) {
      errores.correo = 'El correo es obligatorio.';
    } else {
      const errorCorreo = validarEmail(correo);
      if (errorCorreo) errores.correo = errorCorreo;
    }

    const cambiaContrasena = String(contrasenaNueva).length > 0;
    if (cambiaContrasena) {
      if (String(contrasenaNueva).length < 8) {
        errores.contrasena_nueva = 'La contrasena nueva debe tener al menos 8 caracteres.';
      }
      if (!contrasenaActual) {
        errores.contrasena_actual = 'Escribe tu contrasena actual.';
      }
    }

    if (Object.keys(errores).length > 0) {
      return { error: 'Revisa los campos indicados.', errores, codigoHttp: 422 };
    }

    if (correo !== String(usuario.correo).toLowerCase()) {
      const ocupado = await this.usuarioRepo.correoEnUsoPorOtro(correo, usuarioId);
      if (ocupado) {
        return {
          error: 'Ese correo ya esta en uso.',
          errores: { correo: 'Elige otro correo.' },
          codigoHttp: 409,
        };
      }
    }

    if (cambiaContrasena) {
      const ok = await bcrypt.compare(contrasenaActual, usuario.contrasena_hash);
      if (!ok) {
        return {
          error: 'La contrasena actual no es correcta.',
          errores: { contrasena_actual: 'No coincide.' },
          codigoHttp: 422,
        };
      }
      const hash = await this.hashContrasena(contrasenaNueva);
      await this.usuarioRepo.actualizarContrasena(usuarioId, hash);
      if (tokenActual) {
        const tokenHash = this.seguridad.hashToken(tokenActual);
        await this.tokenRepo.revocarPorUsuarioExcepto(usuarioId, tokenHash);
      } else {
        await this.tokenRepo.revocarPorUsuario(usuarioId);
      }
    }

    await this.usuarioRepo.actualizarPerfil(usuarioId, { nombre, correo });
    const actualizado = await this.usuarioRepo.buscarPorId(usuarioId);

    return {
      usuario: this.mapearUsuarioPublico(actualizado),
      contrasenaActualizada: cambiaContrasena,
      mensaje: cambiaContrasena
        ? 'Perfil y contrasena actualizados. Otras sesiones se cerraron.'
        : 'Perfil actualizado.',
    };
  }

  async solicitarRecuperacion(correo, celular, contexto) {
    const smtpListo = typeof this.correoServicio.estaHabilitadoAsync === 'function'
      ? await this.correoServicio.estaHabilitadoAsync()
      : this.correoServicio.estaHabilitado();
    if (!smtpListo) {
      return {
        error: 'No enviamos el correo: falta conectar el buzon. La contrasena no cambio.',
        codigoHttp: 503,
      };
    }

    const usuario = await this.usuarioRepo.buscarPorCorreo(correo);
    const rolPermitido = contexto === 'plataforma'
      ? usuario?.rol === 'superadmin'
      : usuario?.rol === 'admin' || usuario?.rol === 'staff';

    if (!usuario || !rolPermitido || (contexto === 'plataforma' && !entorno.plataformaHabilitada)) {
      return { error: MENSAJE_NO_COINCIDEN, codigoHttp: 422 };
    }

    let coincide = false;
    if (contexto === 'plataforma') {
      const { correoPlataformaServicio } = await import('./correoPlataformaServicio.js');
      const celularPlataforma = await correoPlataformaServicio.obtenerCelularRecuperacion();
      coincide = celularCoincide(celular, celularPlataforma);
    } else if (usuario.marca_id) {
      const marca = await this.marcaRepo.buscarPorIdCompleto(usuario.marca_id);
      coincide = celularCoincide(celular, marca?.telefono) || celularCoincide(celular, marca?.whatsapp);
    }
    if (!coincide) {
      return { error: MENSAJE_NO_COINCIDEN, codigoHttp: 422 };
    }

    const token = this.seguridad.generarToken();
    const tokenHash = this.seguridad.hashToken(token);
    const expiraEn = new Date(Date.now() + MINUTOS_RECUPERACION * 60 * 1000);
    const base = (process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/$/, '');
    const ruta = contexto === 'plataforma'
      ? '/plataforma/restablecer-contrasena'
      : '/admin/restablecer-contrasena';
    const url = `${base}${ruta}?token=${token}`;

    await this.recuperacionRepo.invalidarPendientes(usuario.id);
    await this.recuperacionRepo.crear({
      usuarioId: usuario.id,
      tokenHash,
      expiraEn,
    });

    try {
      const envio = await this.correoServicio.enviarRecuperacionContrasena({
        correo: usuario.correo,
        nombre: usuario.nombre,
        url,
      });
      if (!envio.enviado) {
        await this.recuperacionRepo.invalidarPendientes(usuario.id);
        return {
          error: 'No pudimos enviar el correo. Intenta de nuevo en unos minutos.',
          codigoHttp: 503,
        };
      }
    } catch {
      await this.recuperacionRepo.invalidarPendientes(usuario.id);
      return {
        error: 'No pudimos enviar el correo. Intenta de nuevo en unos minutos.',
        codigoHttp: 503,
      };
    }

    return { mensaje: MENSAJE_RECUPERACION };
  }

  async restablecerContrasena(token, contrasena) {
    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return { error: 'El enlace ya no sirve. Pide otro desde el inicio de sesion.', codigoHttp: 400 };
    }
    if (String(contrasena).length < 8) {
      return { error: 'La contrasena debe tener al menos 8 caracteres.', codigoHttp: 422 };
    }

    const tokenHash = this.seguridad.hashToken(token);
    const fila = await this.recuperacionRepo.consumir(tokenHash);
    if (!fila || !fila.activo) {
      return { error: 'El enlace ya no sirve. Pide otro desde el inicio de sesion.', codigoHttp: 400 };
    }

    const hash = await this.hashContrasena(contrasena);
    await this.usuarioRepo.actualizarContrasena(fila.usuario_id, hash);
    await this.tokenRepo.revocarPorUsuario(fila.usuario_id);

    return {
      mensaje: 'Contrasena actualizada. Ya puedes entrar.',
      destino: fila.rol === 'superadmin' ? 'plataforma' : 'marca',
    };
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
