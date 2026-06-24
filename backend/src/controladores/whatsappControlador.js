import { whatsappServicio } from '../servicios/whatsappServicio.js';
import { whatsappMarcaServicio } from '../servicios/whatsappMarcaServicio.js';
import { respuestaExito, respuestaError } from '../utilidades/respuestaJson.js';
import { texto } from '../utilidades/sanitizador.js';

export async function obtenerEstadoWhatsappMarca(req, res) {
  const estado = await whatsappMarcaServicio.obtenerEstadoAdmin(req.marcaId);
  if (estado.error) {
    return respuestaError(res, estado.error, estado.codigoHttp ?? 404);
  }
  return respuestaExito(res, estado, 'Estado WhatsApp de la marca');
}

export async function probarWhatsappMarca(req, res) {
  const telefono = texto(req.body?.telefono)?.replace(/\D+/g, '');

  if (!telefono) {
    return respuestaError(res, 'Indica un telefono de prueba.', 422);
  }

  const credenciales = await whatsappMarcaServicio.obtenerCredenciales(req.marcaId);
  if (!credenciales.configurado) {
    return respuestaError(
      res,
      'WhatsApp no esta configurado para esta marca. Guarda Phone Number ID y token.',
      422
    );
  }

  try {
    const resultado = await whatsappServicio.enviarTexto({
      telefono,
      mensaje: `Prueba de WhatsApp desde ${credenciales.nombreMarca ?? 'tu marca'}. Si recibes esto, la configuracion es correcta.`,
      credenciales,
    });

    if (resultado.omitido) {
      return respuestaError(res, 'No se pudo enviar el mensaje de prueba.', 422);
    }

    return respuestaExito(res, resultado, 'Mensaje de prueba enviado');
  } catch (err) {
    return respuestaError(res, err.message, 502);
  }
}
