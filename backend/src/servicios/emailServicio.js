import nodemailer from 'nodemailer';
import {
  PLANTILLA_CORREO_ASUNTO,
  PLANTILLA_CORREO_HTML,
  PLANTILLA_CORREO_TEXTO,
  escaparHtml,
  renderPlantillaHtml,
  renderPlantillaTexto,
  valoresPlantillaCita,
} from '../utilidades/plantillaNotificacion.js';

function smtpEnvConfigurado() {
  return Boolean(
    process.env.SMTP_HOST
    && process.env.SMTP_USUARIO
    && process.env.SMTP_CONTRASENA
  );
}

function smtpDesdeObjeto(smtp) {
  return Boolean(smtp?.host && smtp?.usuario && smtp?.contrasena);
}

function crearTransporte(smtp) {
  return nodemailer.createTransport({
    host: smtp.host,
    port: Number(smtp.puerto ?? 587),
    secure: Boolean(smtp.seguro),
    auth: {
      user: smtp.usuario,
      pass: smtp.contrasena,
    },
  });
}

function smtpDesdeEntorno() {
  if (!smtpEnvConfigurado()) return null;
  return {
    host: process.env.SMTP_HOST,
    puerto: Number(process.env.SMTP_PUERTO ?? 587),
    seguro: process.env.SMTP_SEGURO === '1',
    usuario: process.env.SMTP_USUARIO,
    contrasena: process.env.SMTP_CONTRASENA,
    remitente: process.env.EMAIL_REMITENTE || process.env.SMTP_USUARIO,
  };
}

export class EmailServicio {
  /** Sync: solo entorno. Preferir estaHabilitadoAsync en flujos nuevos. */
  estaHabilitado() {
    return smtpEnvConfigurado();
  }

  async resolverSmtpPlataforma() {
    try {
      const { correoPlataformaServicio } = await import('./correoPlataformaServicio.js');
      const credenciales = await correoPlataformaServicio.leerCredenciales();
      if (smtpDesdeObjeto(credenciales)) return credenciales;
    } catch {
      // Si falla la BD, cae al .env
    }
    return smtpDesdeEntorno();
  }

  async estaHabilitadoAsync() {
    const smtp = await this.resolverSmtpPlataforma();
    return smtpDesdeObjeto(smtp);
  }

  async enviar({ para, asunto, texto, html, transporte, remitente }) {
    if (!para) return { omitido: true, motivo: 'sin_destinatario' };
    if (!transporte) {
      const smtp = await this.resolverSmtpPlataforma();
      if (!smtpDesdeObjeto(smtp)) {
        if (process.env.NODE_ENV !== 'produccion') {
          console.info('[email] SMTP no configurado — mensaje simulado:', { para, asunto });
        }
        return { omitido: true, motivo: 'smtp_no_configurado' };
      }
      transporte = crearTransporte(smtp);
      remitente = remitente || smtp.remitente || smtp.usuario;
    }

    await transporte.sendMail({
      from: remitente,
      to: para,
      subject: asunto,
      text: texto,
      html,
    });

    return { enviado: true };
  }

  async enviarConSmtpMarca({ para, asunto, texto, html, smtp }) {
    if (!para) return { omitido: true, motivo: 'sin_destinatario' };
    if (!smtpDesdeObjeto(smtp)) {
      return { omitido: true, motivo: 'smtp_no_configurado' };
    }

    const transporte = crearTransporte(smtp);
    const de = smtp.remitente || smtp.usuario;

    try {
      await transporte.sendMail({
        from: de,
        to: para,
        subject: asunto,
        text: texto,
        html,
      });
      return { enviado: true };
    } catch (err) {
      return {
        error: true,
        motivo: err?.message || 'error',
      };
    }
  }

  armarConfirmacionDesdePlantilla({ confirmacion, urlConfirmacion, smtp }) {
    const { cita, mensajeConfirmacion } = confirmacion;
    const valores = valoresPlantillaCita({
      nombre: cita.cliente?.nombre,
      servicio: cita.servicio?.nombre,
      fecha: cita.fecha,
      hora: cita.horaInicio,
      codigo: cita.codigo,
      urlConfirmacion,
      marca: cita.marca?.nombreComercial,
    });

    const modo = smtp?.modoPlantilla === 'html' ? 'html' : 'texto';
    const asunto = renderPlantillaTexto(smtp?.asunto || PLANTILLA_CORREO_ASUNTO, valores);
    const texto = renderPlantillaTexto(
      smtp?.cuerpoTexto || mensajeConfirmacion || PLANTILLA_CORREO_TEXTO,
      valores
    );
    const html = modo === 'html'
      ? renderPlantillaHtml(smtp?.cuerpoHtml || PLANTILLA_CORREO_HTML, valores)
      : undefined;

    return { asunto, texto, html };
  }

  async enviarConfirmacionReservaMarca({ confirmacion, urlConfirmacion, smtp }) {
    const { cita } = confirmacion;
    if (!cita.cliente?.correo) {
      return { omitido: true, motivo: 'cliente_sin_correo' };
    }
    if (!smtp) {
      return { omitido: true, motivo: 'smtp_no_configurado' };
    }

    const { asunto, texto, html } = this.armarConfirmacionDesdePlantilla({
      confirmacion,
      urlConfirmacion,
      smtp,
    });

    return this.enviarConSmtpMarca({
      para: cita.cliente.correo,
      asunto,
      texto,
      html,
      smtp,
    });
  }

  /** @deprecated Preferir SMTP de la marca para confirmaciones de cita. */
  async enviarConfirmacionReserva({ confirmacion, urlConfirmacion }) {
    const { cita, mensajeConfirmacion } = confirmacion;
    if (!cita.cliente.correo) {
      return { omitido: true, motivo: 'cliente_sin_correo' };
    }

    const asunto = `Confirmacion de cita — ${cita.marca.nombreComercial}`;
    const texto = [
      mensajeConfirmacion,
      '',
      urlConfirmacion ? `Ver detalle: ${urlConfirmacion}` : '',
      '',
      `Codigo: ${cita.codigo}`,
    ].filter(Boolean).join('\n');

    const html = `
      <p>Hola <strong>${escaparHtml(cita.cliente.nombre)}</strong>,</p>
      <p>${escaparHtml(mensajeConfirmacion)}</p>
      <ul>
        <li><strong>Servicio:</strong> ${escaparHtml(cita.servicio.nombre)}</li>
        <li><strong>Fecha:</strong> ${escaparHtml(cita.fecha)}</li>
        <li><strong>Hora:</strong> ${escaparHtml(cita.horaInicio)}</li>
        <li><strong>Codigo:</strong> ${escaparHtml(cita.codigo)}</li>
      </ul>
      ${urlConfirmacion ? `<p><a href="${escaparHtml(urlConfirmacion)}">Ver confirmacion en linea</a></p>` : ''}
    `;

    return this.enviar({
      para: cita.cliente.correo,
      asunto,
      texto,
      html,
    });
  }

  async enviarRecuperacionContrasena({ correo, nombre, url }) {
    const asunto = 'Elige una contrasena nueva';
    const texto = [
      `Hola ${nombre},`,
      '',
      'Pediste recuperar la contrasena de tu panel.',
      'Este enlace sirve una sola vez y vence en 1 hora:',
      url,
      '',
      'Si no fuiste tu, ignora este correo.',
    ].join('\n');
    const nombreSeguro = escaparHtml(nombre);
    const urlSegura = escaparHtml(url);
    const html = `
      <p>Hola <strong>${nombreSeguro}</strong>,</p>
      <p>Pediste recuperar la contrasena de tu panel.</p>
      <p><a href="${urlSegura}">Elegir una contrasena nueva</a></p>
      <p>Este enlace sirve una sola vez y vence en 1 hora. Si no fuiste tu, ignora este correo.</p>
    `;

    return this.enviar({ para: correo, asunto, texto, html });
  }
}

export const emailServicio = new EmailServicio();
