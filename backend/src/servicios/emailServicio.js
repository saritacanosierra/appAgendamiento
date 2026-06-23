import nodemailer from 'nodemailer';

function smtpConfigurado() {
  return Boolean(
    process.env.SMTP_HOST
    && process.env.SMTP_USUARIO
    && process.env.SMTP_CONTRASENA
  );
}

function crearTransporte() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PUERTO ?? 587),
    secure: process.env.SMTP_SEGURO === '1',
    auth: {
      user: process.env.SMTP_USUARIO,
      pass: process.env.SMTP_CONTRASENA,
    },
  });
}

export class EmailServicio {
  estaHabilitado() {
    return smtpConfigurado();
  }

  async enviar({ para, asunto, texto, html }) {
    if (!para) return { omitido: true, motivo: 'sin_destinatario' };
    if (!smtpConfigurado()) {
      if (process.env.NODE_ENV !== 'produccion') {
        console.info('[email] SMTP no configurado — mensaje simulado:', { para, asunto });
      }
      return { omitido: true, motivo: 'smtp_no_configurado' };
    }

    const transporte = crearTransporte();
    const remitente = process.env.EMAIL_REMITENTE ?? process.env.SMTP_USUARIO;

    await transporte.sendMail({
      from: remitente,
      to: para,
      subject: asunto,
      text: texto,
      html,
    });

    return { enviado: true };
  }

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
      <p>Hola <strong>${cita.cliente.nombre}</strong>,</p>
      <p>${mensajeConfirmacion}</p>
      <ul>
        <li><strong>Servicio:</strong> ${cita.servicio.nombre}</li>
        <li><strong>Fecha:</strong> ${cita.fecha}</li>
        <li><strong>Hora:</strong> ${cita.horaInicio}</li>
        <li><strong>Codigo:</strong> ${cita.codigo}</li>
      </ul>
      ${urlConfirmacion ? `<p><a href="${urlConfirmacion}">Ver confirmacion en linea</a></p>` : ''}
    `;

    return this.enviar({
      para: cita.cliente.correo,
      asunto,
      texto,
      html,
    });
  }
}

export const emailServicio = new EmailServicio();
