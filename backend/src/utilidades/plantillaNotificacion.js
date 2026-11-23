const VARIABLES = [
  'nombre',
  'servicio',
  'fecha',
  'hora',
  'codigo',
  'url_confirmacion',
  'marca',
];

export function escaparHtml(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function valoresPlantillaCita({
  nombre,
  servicio,
  fecha,
  hora,
  codigo,
  urlConfirmacion,
  marca,
}) {
  return {
    nombre: String(nombre ?? ''),
    servicio: String(servicio ?? ''),
    fecha: String(fecha ?? ''),
    hora: String(hora ?? ''),
    codigo: String(codigo ?? ''),
    url_confirmacion: String(urlConfirmacion ?? ''),
    marca: String(marca ?? ''),
  };
}

export function renderPlantillaTexto(plantilla, valores = {}) {
  let texto = String(plantilla ?? '');
  for (const clave of VARIABLES) {
    const re = new RegExp(`\\{\\{\\s*${clave}\\s*\\}\\}`, 'gi');
    texto = texto.replace(re, String(valores[clave] ?? ''));
  }
  return texto;
}

export function renderPlantillaHtml(plantilla, valores = {}) {
  const seguros = {};
  for (const clave of VARIABLES) {
    seguros[clave] = escaparHtml(valores[clave]);
  }
  return renderPlantillaTexto(plantilla, seguros);
}

export const PLANTILLA_WHATSAPP_CONFIRMACION = [
  'Hola {{nombre}}, tu cita en {{marca}} quedo agendada para el {{fecha}} a las {{hora}}.',
  'Servicio: {{servicio}}.',
  'Codigo: {{codigo}}.',
  'Detalle: {{url_confirmacion}}',
].join('\n');

export const PLANTILLA_CORREO_ASUNTO = 'Confirmacion de cita — {{marca}}';

export const PLANTILLA_CORREO_TEXTO = [
  'Hola {{nombre}},',
  '',
  'Tu cita en {{marca}} quedo agendada.',
  'Servicio: {{servicio}}',
  'Fecha: {{fecha}}',
  'Hora: {{hora}}',
  'Codigo: {{codigo}}',
  '',
  'Ver detalle: {{url_confirmacion}}',
  '',
  'Si no recibiste este aviso bien, comunicate directamente con la marca.',
].join('\n');

export const PLANTILLA_CORREO_HTML = `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:24px;font-family:Arial,sans-serif;background:#f7f7f8;color:#1c2430;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:24px;">
    <tr><td>
      <p style="margin:0 0 12px;">Hola <strong>{{nombre}}</strong>,</p>
      <p style="margin:0 0 16px;">Tu cita en <strong>{{marca}}</strong> quedo agendada.</p>
      <ul style="padding-left:18px;margin:0 0 20px;line-height:1.6;">
        <li><strong>Servicio:</strong> {{servicio}}</li>
        <li><strong>Fecha:</strong> {{fecha}}</li>
        <li><strong>Hora:</strong> {{hora}}</li>
        <li><strong>Codigo:</strong> {{codigo}}</li>
      </ul>
      <p style="margin:0 0 24px;">
        <a href="{{url_confirmacion}}" style="display:inline-block;min-height:48px;line-height:48px;padding:0 20px;border-radius:999px;background:#1e3a4c;color:#ffffff;text-decoration:none;font-weight:700;">
          Ver confirmacion
        </a>
      </p>
      <p style="margin:0;font-size:13px;color:#667085;">Si este correo no llego bien, comunicate directamente con la marca.</p>
    </td></tr>
  </table>
</body>
</html>`;

export function motivoAvisoLegible(motivo) {
  const mapa = {
    sin_destinatario: 'Falta el correo de la clienta.',
    cliente_sin_correo: 'La clienta no dejo correo.',
    smtp_no_configurado: 'Falta configurar el correo SMTP de la marca.',
    correo_canal_apagado: 'El canal de correo esta apagado.',
    whatsapp_canal_apagado: 'El canal de WhatsApp esta apagado.',
    whatsapp_marca_no_configurado: 'Falta configurar WhatsApp Business de la marca.',
    sin_telefono: 'La clienta no dejo telefono.',
    sin_indicativo: 'Falta el indicativo del pais en WhatsApp.',
    sin_mensaje: 'El mensaje de WhatsApp esta vacio.',
    sin_marca: 'No se encontro la marca.',
    error: 'El proveedor rechazo el envio.',
  };
  return mapa[motivo] || (motivo ? String(motivo) : 'No se pudo enviar el aviso.');
}
