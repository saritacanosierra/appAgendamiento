const API_VERSION = process.env.WHATSAPP_API_VERSION ?? 'v21.0';

function normalizarTelefonoWhatsApp(telefono, codigoPais = '52') {
  const digitos = String(telefono ?? '').replace(/\D+/g, '');
  if (!digitos) return null;

  const prefijo = codigoPais || '52';
  if (digitos.startsWith(prefijo)) {
    return digitos;
  }
  if (digitos.length === 10) {
    return `${prefijo}${digitos}`;
  }
  return digitos;
}

function simularEnvio(credenciales, destino, cuerpo) {
  if (process.env.NODE_ENV !== 'produccion') {
    console.info('[whatsapp] mensaje simulado:', {
      marcaId: credenciales?.marcaId,
      remitenteNumeroPublico: credenciales?.numeroPublico,
      remitentePhoneNumberId: credenciales?.phoneNumberId,
      destino,
      ...cuerpo,
    });
  }
}

export class WhatsappServicio {
  credencialesListas(credenciales) {
    return Boolean(
      credenciales?.configurado
      && credenciales.phoneNumberId
      && credenciales.token
    );
  }

  async enviarTexto({ telefono, mensaje, credenciales }) {
    const codigoPais = credenciales?.codigoPais ?? '52';
    const destino = normalizarTelefonoWhatsApp(telefono, codigoPais);

    if (!destino) {
      return { omitido: true, motivo: 'sin_telefono' };
    }
    if (!mensaje?.trim()) {
      return { omitido: true, motivo: 'sin_mensaje' };
    }
    if (!credenciales?.marcaId) {
      return { omitido: true, motivo: 'sin_marca' };
    }

    if (!this.credencialesListas(credenciales)) {
      simularEnvio(credenciales, destino, { mensaje });
      return { omitido: true, motivo: 'whatsapp_marca_no_configurado' };
    }

    const url = `https://graph.facebook.com/${API_VERSION}/${credenciales.phoneNumberId}/messages`;

    const respuesta = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credenciales.token}`,
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

    return {
      enviado: true,
      id: datos.messages?.[0]?.id ?? null,
      remitentePhoneNumberId: credenciales.phoneNumberId,
      remitenteNumeroPublico: credenciales.numeroPublico,
      destino,
    };
  }

  async enviarConfirmacionReserva({ confirmacion, urlConfirmacion, credenciales }) {
    const { cita, mensajeConfirmacion } = confirmacion;
    const lineas = [
      mensajeConfirmacion,
      urlConfirmacion ? `Detalle: ${urlConfirmacion}` : '',
      `Codigo: ${cita.codigo}`,
    ].filter(Boolean);

    return this.enviarTexto({
      telefono: cita.cliente.telefono,
      mensaje: lineas.join('\n'),
      credenciales,
    });
  }

  async enviarPlantilla({
    telefono,
    nombrePlantilla,
    idioma,
    parametrosCuerpo = [],
    credenciales,
  }) {
    const codigoPais = credenciales?.codigoPais ?? '52';
    const destino = normalizarTelefonoWhatsApp(telefono, codigoPais);

    if (!destino) {
      return { omitido: true, motivo: 'sin_telefono' };
    }

    if (!this.credencialesListas(credenciales)) {
      simularEnvio(credenciales, destino, { nombrePlantilla, parametrosCuerpo });
      return { omitido: true, motivo: 'whatsapp_marca_no_configurado' };
    }

    const url = `https://graph.facebook.com/${API_VERSION}/${credenciales.phoneNumberId}/messages`;

    const respuesta = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credenciales.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: destino,
        type: 'template',
        template: {
          name: nombrePlantilla,
          language: { code: idioma },
          components: parametrosCuerpo.length
            ? [
                {
                  type: 'body',
                  parameters: parametrosCuerpo.map((textoParam) => ({
                    type: 'text',
                    text: String(textoParam),
                  })),
                },
              ]
            : undefined,
        },
      }),
    });

    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      const detalle = datos?.error?.message ?? 'Error al enviar plantilla WhatsApp.';
      throw new Error(detalle);
    }

    return {
      enviado: true,
      id: datos.messages?.[0]?.id ?? null,
      remitentePhoneNumberId: credenciales.phoneNumberId,
      remitenteNumeroPublico: credenciales.numeroPublico,
      destino,
    };
  }

  async enviarRecordatorioCita({
    telefono,
    clienteNombre,
    marcaNombre,
    servicioNombre,
    fecha,
    horaInicio,
    codigo,
    direccion,
    urlMiCita,
    credenciales,
  }) {
    const nombrePlantilla = credenciales?.plantillaRecordatorio?.trim();
    const idiomaPlantilla = credenciales?.plantillaIdioma ?? 'es_MX';
    const primerNombre = (clienteNombre ?? 'Cliente').trim().split(/\s+/)[0];

    if (nombrePlantilla) {
      return this.enviarPlantilla({
        telefono,
        nombrePlantilla,
        idioma: idiomaPlantilla,
        parametrosCuerpo: [
          primerNombre,
          marcaNombre,
          servicioNombre,
          fecha,
          horaInicio,
          codigo,
        ],
        credenciales,
      });
    }

    const lineas = [
      `Hola ${primerNombre}, te recordamos tu cita en ${marcaNombre}.`,
      `Servicio: ${servicioNombre}`,
      `Fecha: ${fecha} a las ${horaInicio}`,
      `Codigo: ${codigo}`,
      direccion ? `Direccion: ${direccion}` : '',
      urlMiCita ? `Consulta tu cita: ${urlMiCita}` : '',
      'Te esperamos.',
    ].filter(Boolean);

    return this.enviarTexto({ telefono, mensaje: lineas.join('\n'), credenciales });
  }
}

export const whatsappServicio = new WhatsappServicio();
