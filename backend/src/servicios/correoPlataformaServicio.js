import { ConfiguracionPlataformaRepositorio } from '../repositorios/plataformaRepositorio.js';
import { emailServicio } from './emailServicio.js';
import { email as validarEmail, telefono as validarTelefono } from '../utilidades/validador.js';
import { texto } from '../utilidades/sanitizador.js';

export const CLAVES_SMTP_PLATAFORMA = {
  host: 'smtp_host',
  puerto: 'smtp_puerto',
  seguro: 'smtp_seguro',
  usuario: 'smtp_usuario',
  contrasena: 'smtp_contrasena',
  remitente: 'smtp_remitente',
  celularRecuperacion: 'smtp_celular_recuperacion',
};

function textoClave(valor) {
  const t = String(valor ?? '').trim();
  return t || '';
}

export class CorreoPlataformaServicio {
  constructor(deps = {}) {
    this.config = deps.config ?? new ConfiguracionPlataformaRepositorio();
    this.email = deps.email ?? emailServicio;
    this.entorno = deps.entorno ?? process.env;
  }

  async #leer(clave, envKey = null) {
    const guardado = textoClave(await this.config.obtener(clave));
    if (guardado) return { valor: guardado, fuente: 'plataforma' };
    if (envKey) {
      const entorno = textoClave(this.entorno[envKey]);
      if (entorno) return { valor: entorno, fuente: 'entorno' };
    }
    return { valor: '', fuente: 'ninguna' };
  }

  async leerCredenciales() {
    const [host, puerto, seguro, usuario, contrasena, remitente, celular] = await Promise.all([
      this.#leer(CLAVES_SMTP_PLATAFORMA.host, 'SMTP_HOST'),
      this.#leer(CLAVES_SMTP_PLATAFORMA.puerto, 'SMTP_PUERTO'),
      this.#leer(CLAVES_SMTP_PLATAFORMA.seguro, 'SMTP_SEGURO'),
      this.#leer(CLAVES_SMTP_PLATAFORMA.usuario, 'SMTP_USUARIO'),
      this.#leer(CLAVES_SMTP_PLATAFORMA.contrasena, 'SMTP_CONTRASENA'),
      this.#leer(CLAVES_SMTP_PLATAFORMA.remitente, 'EMAIL_REMITENTE'),
      this.#leer(CLAVES_SMTP_PLATAFORMA.celularRecuperacion, 'SUPERADMIN_CELULAR'),
    ]);

    const puertoNum = Number(puerto.valor || 587) || 587;
    const seguroBool = seguro.valor === '1' || seguro.valor === 'true';

    return {
      host: host.valor,
      puerto: puertoNum,
      seguro: seguroBool,
      usuario: usuario.valor,
      contrasena: contrasena.valor,
      remitente: remitente.valor || usuario.valor,
      celularRecuperacion: celular.valor.replace(/\D+/g, ''),
      fuentes: {
        host: host.fuente,
        usuario: usuario.fuente,
        contrasena: contrasena.fuente,
      },
    };
  }

  async obtenerEstadoAdmin() {
    const c = await this.leerCredenciales();
    const listo = Boolean(c.host && c.usuario && c.contrasena);
    return {
      listo,
      host: c.host,
      puerto: c.puerto,
      seguro: c.seguro,
      usuario: c.usuario,
      remitente: c.remitente,
      celularRecuperacion: c.celularRecuperacion,
      contrasenaConfigurada: Boolean(c.contrasena),
      desdeEntorno: c.fuentes.host === 'entorno' || c.fuentes.usuario === 'entorno',
    };
  }

  async guardarConfigAdmin(datos = {}) {
    const actual = await this.leerCredenciales();
    const host = texto(datos.host ?? datos.smtp_host ?? actual.host);
    const puerto = Number(datos.puerto ?? datos.smtp_puerto ?? actual.puerto) || 587;
    const seguro = Boolean(datos.seguro ?? datos.smtp_seguro ?? actual.seguro);
    const usuario = texto(datos.usuario ?? datos.smtp_usuario ?? actual.usuario).toLowerCase();
    const remitente = texto(datos.remitente ?? datos.smtp_remitente ?? actual.remitente) || usuario;
    const celular = texto(datos.celular_recuperacion ?? datos.celularRecuperacion ?? actual.celularRecuperacion)
      .replace(/\D+/g, '');
    const contrasenaNueva = String(
      datos.contrasena ?? datos.smtp_contrasena ?? datos.contrasena_nueva ?? ''
    ).trim();
    const contrasena = contrasenaNueva || actual.contrasena;

    const errores = {};
    if (!host) errores.host = 'Indica el host SMTP (ej. smtp.gmail.com).';
    if (!usuario || validarEmail(usuario)) errores.usuario = 'Correo SMTP invalido.';
    if (!contrasena) errores.contrasena = 'Indica la contrasena de aplicacion.';
    if (celular && validarTelefono(celular)) {
      errores.celular_recuperacion = 'Celular de recuperacion invalido (min. 10 digitos).';
    }

    if (Object.keys(errores).length > 0) {
      return { error: 'Revisa los campos del correo.', errores, codigoHttp: 422 };
    }

    await this.config.guardar(CLAVES_SMTP_PLATAFORMA.host, host);
    await this.config.guardar(CLAVES_SMTP_PLATAFORMA.puerto, String(puerto));
    await this.config.guardar(CLAVES_SMTP_PLATAFORMA.seguro, seguro ? '1' : '0');
    await this.config.guardar(CLAVES_SMTP_PLATAFORMA.usuario, usuario);
    await this.config.guardar(CLAVES_SMTP_PLATAFORMA.contrasena, contrasena);
    await this.config.guardar(CLAVES_SMTP_PLATAFORMA.remitente, remitente || usuario);
    await this.config.guardar(CLAVES_SMTP_PLATAFORMA.celularRecuperacion, celular || null);

    return this.obtenerEstadoAdmin();
  }

  async obtenerCelularRecuperacion() {
    const c = await this.leerCredenciales();
    return c.celularRecuperacion || '';
  }

  async probarEnvio(correoDestino) {
    const destino = texto(correoDestino).toLowerCase();
    if (!destino || validarEmail(destino)) {
      return { error: 'Indica un correo valido para la prueba.', codigoHttp: 422 };
    }

    const smtp = await this.leerCredenciales();
    if (!smtp.host || !smtp.usuario || !smtp.contrasena) {
      return {
        error: 'Primero guarda el correo SMTP de la plataforma.',
        codigoHttp: 422,
      };
    }

    const resultado = await this.email.enviarConSmtpMarca({
      para: destino,
      asunto: 'Prueba de correo — plataforma',
      texto: 'Si lees esto, el SMTP de plataforma ya puede enviar recuperaciones de contrasena.',
      html: '<p>Si lees esto, el SMTP de plataforma ya puede enviar recuperaciones de contraseña.</p>',
      smtp: {
        host: smtp.host,
        puerto: smtp.puerto,
        seguro: smtp.seguro,
        usuario: smtp.usuario,
        contrasena: smtp.contrasena,
        remitente: smtp.remitente,
      },
    });

    if (resultado.error || resultado.omitido) {
      return {
        error: resultado.motivo || 'No se pudo enviar la prueba.',
        codigoHttp: 502,
      };
    }

    return { enviado: true, mensaje: 'Correo de prueba enviado.' };
  }
}

export const correoPlataformaServicio = new CorreoPlataformaServicio();
