import crypto from 'crypto';
import { ConfiguracionRepositorio } from '../repositorios/configuracionRepositorio.js';

const estadosPendientes = new Map();
const TTL_ESTADO_MS = 10 * 60 * 1000;

function limpiarEstadosExpirados() {
  const ahora = Date.now();
  for (const [state, datos] of estadosPendientes.entries()) {
    if (datos.expira < ahora) estadosPendientes.delete(state);
  }
}

function normalizarHoraGoogle(hora) {
  const texto = String(hora ?? '').trim();
  const coincidencia = texto.match(/^(\d{1,2}):(\d{2})/);
  if (!coincidencia) return '09:00:00';
  return `${coincidencia[1].padStart(2, '0')}:${coincidencia[2]}:00`;
}

function obtenerConfigGoogle() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI ?? '',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  };
}

export class GoogleCalendarServicio {
  constructor(configRepo = new ConfiguracionRepositorio()) {
    this.configRepo = configRepo;
  }

  estaConfigurado() {
    const { clientId, clientSecret, redirectUri } = obtenerConfigGoogle();
    return Boolean(clientId && clientSecret && redirectUri);
  }

  async obtenerEstado(marcaId) {
    const config = await this.configRepo.obtenerConfiguracionJson(marcaId);
    const google = config.google_calendar ?? null;

    return {
      disponible: this.estaConfigurado(),
      conectado: Boolean(google?.refresh_token),
      conectadoEn: google?.conectado_en ?? null,
      calendarioId: google?.calendario_id ?? 'primary',
    };
  }

  generarUrlAutorizacion(marcaId) {
    if (!this.estaConfigurado()) {
      return { error: 'Google Calendar no esta configurado en el servidor.', codigoHttp: 503 };
    }

    limpiarEstadosExpirados();

    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    const state = crypto.randomBytes(16).toString('hex');

    estadosPendientes.set(state, {
      marcaId,
      codeVerifier,
      expira: Date.now() + TTL_ESTADO_MS,
    });

    const { clientId, redirectUri } = obtenerConfigGoogle();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar.events',
      access_type: 'offline',
      prompt: 'consent',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
  }

  async procesarCallback(code, state) {
    if (!code || !state) {
      return { error: 'Parametros de callback invalidos.', codigoHttp: 400 };
    }

    limpiarEstadosExpirados();
    const pendiente = estadosPendientes.get(state);
    if (!pendiente) {
      return { error: 'Estado OAuth invalido o expirado.', codigoHttp: 400 };
    }

    estadosPendientes.delete(state);

    const { clientId, clientSecret, redirectUri, frontendUrl } = obtenerConfigGoogle();

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: pendiente.codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const respuesta = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const tokens = await respuesta.json();
    if (!respuesta.ok) {
      return {
        error: tokens.error_description ?? tokens.error ?? 'No se pudo obtener el token de Google.',
        codigoHttp: 502,
      };
    }

    const configActual = await this.configRepo.obtenerConfiguracionJson(pendiente.marcaId);
    const refreshToken = tokens.refresh_token ?? configActual.google_calendar?.refresh_token;

    if (!refreshToken) {
      return {
        error: 'Google no devolvio refresh_token. Revoca el acceso en tu cuenta Google y vuelve a conectar con prompt de consentimiento.',
        codigoHttp: 502,
      };
    }

    await this.configRepo.actualizarConfiguracionJson(pendiente.marcaId, {
      google_calendar: {
        refresh_token: refreshToken,
        conectado_en: new Date().toISOString(),
        calendario_id: configActual.google_calendar?.calendario_id ?? 'primary',
      },
    });

    return {
      redirectUrl: `${frontendUrl}/admin/configuracion-marca?google=conectado`,
    };
  }

  async desconectar(marcaId) {
    await this.configRepo.actualizarConfiguracionJson(marcaId, {
      google_calendar: null,
    });
    return { ok: true };
  }

  async obtenerAccessToken(marcaId) {
    const config = await this.configRepo.obtenerConfiguracionJson(marcaId);
    const refreshToken = config.google_calendar?.refresh_token;
    if (!refreshToken) return null;

    const { clientId, clientSecret } = obtenerConfigGoogle();
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const respuesta = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const datos = await respuesta.json();
    if (!respuesta.ok) {
      if (datos.error === 'invalid_grant') {
        await this.desconectar(marcaId);
      }
      return null;
    }

    return {
      accessToken: datos.access_token,
      calendarioId: config.google_calendar?.calendario_id ?? 'primary',
    };
  }

  async probarSincronizacion(marcaId) {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const fecha = manana.toISOString().slice(0, 10);

    return this.sincronizarCita(marcaId, {
      fecha,
      horaInicio: '10:00',
      horaFin: '10:30',
      titulo: 'Prueba Spa Unas — Google Calendar',
      descripcion: 'Evento de prueba generado desde el panel admin. Puedes eliminarlo.',
      clienteNombre: 'Prueba',
    });
  }

  async sincronizarCita(marcaId, cita) {
    const credenciales = await this.obtenerAccessToken(marcaId);
    if (!credenciales) return { omitido: true, motivo: 'sin_conexion' };

    const zona = process.env.ZONA_HORARIA ?? 'America/Mexico_City';
    const inicio = `${cita.fecha}T${normalizarHoraGoogle(cita.horaInicio ?? cita.hora_inicio)}`;
    const fin = `${cita.fecha}T${normalizarHoraGoogle(cita.horaFin ?? cita.hora_fin)}`;

    const evento = {
      summary: cita.titulo ?? `Cita — ${cita.clienteNombre ?? 'Cliente'}`,
      description: cita.descripcion ?? '',
      start: { dateTime: inicio, timeZone: zona },
      end: { dateTime: fin, timeZone: zona },
    };

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(credenciales.calendarioId)}/events`;

    const respuesta = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credenciales.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(evento),
    });

    const cuerpo = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      return {
        error: cuerpo.error?.message ?? 'No se pudo crear el evento en Google Calendar.',
        codigoHttp: respuesta.status,
      };
    }

    return { eventoId: cuerpo.id, htmlLink: cuerpo.htmlLink };
  }
}

export const googleCalendarServicio = new GoogleCalendarServicio();
