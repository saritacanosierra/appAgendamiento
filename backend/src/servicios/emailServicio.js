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

function resendEnvConfigurado() {
  return Boolean(String(process.env.RESEND_API_KEY || '').trim());
}

async function enviarViaResend({ apiKey, para, asunto, texto, html, remitente }) {
  const clave = String(apiKey || '').trim();
  if (!clave) {
    return { omitido: true, motivo: 'resend_no_configurado' };
  }

  const de = String(remitente || '').trim() || 'Agenda <onboarding@resend.dev>';
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), 15_000);

  try {
    const respuesta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: controlador.signal,
      headers: {
        Authorization: `Bearer ${clave}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: de,
        to: [para],
        subject: asunto,
        text: texto,
        html: html || undefined,
      }),
    });

    const cuerpo = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      const detalle = cuerpo?.message || cuerpo?.error || `HTTP ${respuesta.status}`;
      return {
        error: true,
        motivo: String(detalle).includes('domain')
          ? `${detalle} — En pruebas usa remitente: Agenda <onboarding@resend.dev>`
          : String(detalle),
      };
    }
    return { enviado: true, proveedor: 'resend', id: cuerpo?.id };
  } catch (err) {
    if (err?.name === 'AbortError') {
      return { error: true, motivo: 'timeout Resend' };
    }
    return { error: true, motivo: err?.message || 'error Resend' };
  } finally {
    clearTimeout(temporizador);
  }
}

function smtpDesdeObjeto(smtp) {
  return Boolean(smtp?.host && smtp?.usuario && smtp?.contrasena);
}

function mensajeErrorSmtp(err) {
  const raw = String(err?.message || err || 'error');
  const bajo = raw.toLowerCase();
  if (
    bajo.includes('timeout')
    || bajo.includes('timed out')
    || bajo.includes('etimedout')
    || bajo.includes('econnrefused')
    || bajo.includes('enotfound')
    || bajo.includes('blocked')
  ) {
    return (
      'No se pudo conectar al correo SMTP (tiempo agotado o bloqueado). '
      + 'En Render el puerto 587/465 a veces está cerrado: revisa la contraseña de aplicación '
      + 'o usa un proveedor de correo (Resend, SendGrid, Mailgun).'
    );
  }
  if (bajo.includes('invalid login') || bajo.includes('authentication') || bajo.includes('535')) {
    return 'Gmail rechazó el usuario o la contraseña de aplicación. Genera una nueva en Google.';
  }
  return raw;
}

function normalizarRemitente(remitente, usuario) {
  const de = String(remitente ?? '').trim();
  const cuenta = String(usuario ?? '').trim();
  if (!de) return cuenta;
  if (de.includes('@')) return de;
  // Solo nombre (ej. "Agendaapp") → "Agendaapp <correo@gmail.com>"
  return cuenta ? `${de} <${cuenta}>` : de;
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
    // Corto a propósito: si Render corta a ~30s sin CORS, el navegador solo ve "CORS".
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 12_000,
  });
}

async function enviarConTope(transporte, mail, ms = 15_000) {
  let temporizador;
  try {
    return await Promise.race([
      transporte.sendMail(mail),
      new Promise((_, reject) => {
        temporizador = setTimeout(
          () => reject(new Error('timeout SMTP')),
          ms
        );
      }),
    ]);
  } finally {
    if (temporizador) clearTimeout(temporizador);
  }
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
    return resendEnvConfigurado() || smtpEnvConfigurado();
  }

  async resolverCredencialesPlataforma() {
    try {
      const { correoPlataformaServicio } = await import('./correoPlataformaServicio.js');
      return await correoPlataformaServicio.leerCredenciales();
    } catch {
      return {
        ...smtpDesdeEntorno(),
        resendApiKey: String(process.env.RESEND_API_KEY || '').trim(),
        proveedor: resendEnvConfigurado()
          ? 'resend'
          : (smtpEnvConfigurado() ? 'smtp' : 'ninguno'),
      };
    }
  }

  async resolverSmtpPlataforma() {
    const cred = await this.resolverCredencialesPlataforma();
    if (smtpDesdeObjeto(cred)) return cred;
    return smtpDesdeEntorno();
  }

  async estaHabilitadoAsync() {
    const cred = await this.resolverCredencialesPlataforma();
    return Boolean(cred?.resendApiKey) || smtpDesdeObjeto(cred);
  }

  async enviarPlataforma({ para, asunto, texto, html, credenciales }) {
    if (!para) return { omitido: true, motivo: 'sin_destinatario' };
    const cred = credenciales || await this.resolverCredencialesPlataforma();

    if (cred?.resendApiKey) {
      let de = normalizarRemitente(cred.remitente, cred.usuario)
        || 'Agenda <onboarding@resend.dev>';
      // Sin dominio verificado en Resend, Gmail como "from" falla.
      if (/@gmail\.com|>\s*$/i.test(de) && /gmail\.com|googlemail\.com/i.test(de)) {
        de = 'Agenda <onboarding@resend.dev>';
      }
      if (!de.includes('@')) de = 'Agenda <onboarding@resend.dev>';
      return enviarViaResend({
        apiKey: cred.resendApiKey,
        para,
        asunto,
        texto,
        html,
        remitente: de,
      });
    }

    if (!smtpDesdeObjeto(cred)) {
      if (process.env.NODE_ENV !== 'produccion') {
        console.info('[email] sin Resend ni SMTP — mensaje simulado:', { para, asunto });
      }
      return { omitido: true, motivo: 'smtp_no_configurado' };
    }

    return this.enviarConSmtpMarca({
      para,
      asunto,
      texto,
      html,
      smtp: cred,
    });
  }

  async enviar({ para, asunto, texto, html, transporte, remitente }) {
    if (!para) return { omitido: true, motivo: 'sin_destinatario' };
    if (!transporte) {
      return this.enviarPlataforma({ para, asunto, texto, html });
    }

    try {
      await enviarConTope(transporte, {
        from: remitente,
        to: para,
        subject: asunto,
        text: texto,
        html,
      });
      return { enviado: true };
    } catch (err) {
      const motivo = mensajeErrorSmtp(err);
      if (process.env.NODE_ENV !== 'produccion') {
        console.warn('[email] envio fallido:', motivo);
      }
      return { error: true, motivo };
    }
  }

  async enviarConSmtpMarca({ para, asunto, texto, html, smtp }) {
    if (!para) return { omitido: true, motivo: 'sin_destinatario' };
    if (!smtpDesdeObjeto(smtp)) {
      return { omitido: true, motivo: 'smtp_no_configurado' };
    }

    const transporte = crearTransporte(smtp);
    const de = normalizarRemitente(smtp.remitente, smtp.usuario);

    try {
      await enviarConTope(transporte, {
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
        motivo: mensajeErrorSmtp(err),
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
