import { correoMarcaServicio } from '../servicios/correoMarcaServicio.js';
import { emailServicio } from '../servicios/emailServicio.js';
import { respuestaExito, respuestaError } from '../utilidades/respuestaJson.js';
import { texto } from '../utilidades/sanitizador.js';
import { email as validarEmail } from '../utilidades/validador.js';

export async function obtenerEstadoCorreoMarca(req, res) {
  const estado = await correoMarcaServicio.obtenerEstadoAdmin(req.marcaId);
  if (estado.error) {
    return respuestaError(res, estado.error, estado.codigoHttp ?? 404);
  }
  return respuestaExito(res, estado, 'Estado de avisos de la marca');
}

export async function probarCorreoMarca(req, res) {
  const para = texto(req.body?.correo ?? req.body?.para);
  const errorCorreo = validarEmail(para);
  if (!para || errorCorreo) {
    return respuestaError(res, errorCorreo || 'Indica un correo de prueba.', 422);
  }

  const credenciales = await correoMarcaServicio.obtenerCredencialesEnvio(req.marcaId);
  if (!credenciales.listo) {
    return respuestaError(
      res,
      'Falta el SMTP de la marca. Guarda host, usuario y contraseña del buzón.',
      422
    );
  }

  const nombreMarca = credenciales.marca?.nombreComercial || 'tu marca';
  const resultado = await emailServicio.enviarConSmtpMarca({
    para,
    asunto: `Prueba de correo — ${nombreMarca}`,
    texto: `Prueba de correo desde ${nombreMarca}. Si recibes esto, el SMTP de la marca funciona.`,
    html: `<p>Prueba de correo desde <strong>${nombreMarca}</strong>.</p><p>Si recibes esto, el SMTP de la marca funciona.</p>`,
    smtp: credenciales.smtp,
  });

  if (resultado.error || resultado.omitido) {
    return respuestaError(res, resultado.motivo || 'No se pudo enviar el correo de prueba.', 502);
  }

  return respuestaExito(res, { enviado: true, para }, 'Correo de prueba enviado');
}
