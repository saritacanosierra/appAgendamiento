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
    if (!respuesta.ok || !tokens.refresh_token) {
      return {
        error: tokens.error_description ?? 'No se pudo obtener el token de Google.',
        codigoHttp: 502,
      };
    }

    await this.configRepo.actualizarConfiguracionJson(pendiente.marcaId, {
      google_calendar: {
        refresh_token: tokens.refresh_token,
        conectado_en: new Date().toISOString(),
        calendario_id: 'primary',
      },
    });

    return {
      redirectUrl: `${frontendUrl}/admin/configuracion-marca?google=conectado`,
    };
  }

  async desconectar(marcaId) {
    const config = await this.configRepo.obtenerConfiguracionJson(marcaId);
    const { google_calendar: _, ...resto } = config;
    await this.configRepo.actualizarConfiguracionJson(marcaId, resto);
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
    if (!respuesta.ok) return null;

    return {
      accessToken: datos.access_token,
      calendarioId: config.google_calendar?.calendario_id ?? 'primary',
    };
  }

  async sincronizarCita(marcaId, cita) {
    const credenciales = await this.obtenerAccessToken(marcaId);
    if (!credenciales) return { omitido: true };

    const inicio = `${cita.fecha}T${cita.horaInicio ?? cita.hora_inicio}:00`;
    const fin = `${cita.fecha}T${cita.horaFin ?? cita.hora_fin}:00`;

    const evento = {
      summary: cita.titulo ?? `Cita — ${cita.clienteNombre ?? 'Cliente'}`,
      description: cita.descripcion ?? '',
      start: { dateTime: inicio, timeZone: process.env.ZONA_HORARIA ?? 'America/Mexico_City' },
      end: { dateTime: fin, timeZone: process.env.ZONA_HORARIA ?? 'America/Mexico_City' },
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

    if (!respuesta.ok) {
      return { error: 'No se pudo crear el evento en Google Calendar.' };
    }

    const eventoCreado = await respuesta.json();
    return { eventoId: eventoCreado.id, htmlLink: eventoCreado.htmlLink };
  }
}

export const googleCalendarServicio = new GoogleCalendarServicio();
