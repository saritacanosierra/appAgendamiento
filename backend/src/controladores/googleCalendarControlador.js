import { googleCalendarServicio } from '../servicios/googleCalendarServicio.js';
import { respuestaExito, respuestaError } from '../utilidades/respuestaJson.js';
import { texto } from '../utilidades/sanitizador.js';

export async function obtenerEstadoGoogle(req, res) {
  const estado = await googleCalendarServicio.obtenerEstado(req.marcaId);
  return respuestaExito(res, estado, 'Estado de Google Calendar');
}

export async function iniciarAutorizacionGoogle(req, res) {
  const resultado = googleCalendarServicio.generarUrlAutorizacion(req.marcaId);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 503);
  }

  return respuestaExito(res, { url: resultado.url }, 'URL de autorizacion generada');
}

export async function callbackGoogle(req, res) {
  const code = texto(req.query.code);
  const state = texto(req.query.state);

  const resultado = await googleCalendarServicio.procesarCallback(code, state);

  if (resultado.error) {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const motivo = encodeURIComponent(resultado.error);
    return res.redirect(`${frontendUrl}/admin/configuracion-marca?google=error&motivo=${motivo}`);
  }

  return res.redirect(resultado.redirectUrl);
}

export async function desconectarGoogle(req, res) {
  await googleCalendarServicio.desconectar(req.marcaId);
  return respuestaExito(res, null, 'Google Calendar desconectado');
}

export async function probarGoogle(req, res) {
  const resultado = await googleCalendarServicio.probarSincronizacion(req.marcaId);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 502);
  }

  if (resultado.omitido) {
    return respuestaError(res, 'Google Calendar no esta conectado para esta marca.', 409);
  }

  return respuestaExito(res, {
    eventoId: resultado.eventoId,
    htmlLink: resultado.htmlLink,
  }, 'Evento de prueba creado en Google Calendar');
}
