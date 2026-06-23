const API_VERSION = process.env.WHATSAPP_API_VERSION ?? 'v21.0';

function whatsappConfigurado() {
  return Boolean(
    process.env.WHATSAPP_TOKEN
    && process.env.WHATSAPP_PHONE_NUMBER_ID
    && process.env.WHATSAPP_HABILITADO === '1'
  );
}

function normalizarTelefonoWhatsApp(telefono) {
  const digitos = String(telefono ?? '').replace(/\D+/g, '');
  if (!digitos) return null;

  const codigoPais = process.env.WHATSAPP_CODIGO_PAIS ?? '52';
  if (digitos.startsWith(codigoPais)) {
    return digitos;
  }
  if (digitos.length === 10) {
    return `${codigoPais}${digitos}`;
  }
  return digitos;
}

export class WhatsappServicio {
  estaHabilitado() {
    return whatsappConfigurado();
  }

  async enviarTexto({ telefono, mensaje }) {
    const destino = normalizarTelefonoWhatsApp(telefono);
    if (!destino) {
      return { omitido: true, motivo: 'sin_telefono' };
    }
    if (!mensaje?.trim()) {
      return { omitido: true, motivo: 'sin_mensaje' };
    }

    if (!whatsappConfigurado()) {
      if (process.env.NODE_ENV !== 'produccion') {
        console.info('[whatsapp] API no configurada — mensaje simulado:', { destino, mensaje });
      }
      return { omitido: true, motivo: 'whatsapp_no_configurado' };
    }

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const url = `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`;

    const respuesta = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: destino,
        type: 'text',
        text: { preview_url: false, body: mensaje },
      }),
    });

    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      const detalle = datos?.error?.message ?? 'Error al enviar WhatsApp.';
      throw new Error(detalle);
    }

    return { enviado: true, id: datos.messages?.[0]?.id ?? null };
  }

  async enviarConfirmacionReserva({ confirmacion, urlConfirmacion }) {
    const { cita, mensajeConfirmacion } = confirmacion;
    const lineas = [
      mensajeConfirmacion,
      urlConfirmacion ? `Detalle: ${urlConfirmacion}` : '',
      `Codigo: ${cita.codigo}`,
    ].filter(Boolean);

    return this.enviarTexto({
      telefono: cita.cliente.telefono,
      mensaje: lineas.join('\n'),
    });
  }
}

export const whatsappServicio = new WhatsappServicio();
