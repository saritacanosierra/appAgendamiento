export function validarWhatsappCliente(valor) {
  const original = String(valor ?? '').trim();
  if (!original) return 'Escribe tu celular.';
  if (/[a-zA-Z]/.test(original)) {
    return 'El celular solo puede incluir numeros.';
  }
  const digitos = original.replace(/\D+/g, '');
  if (digitos.length < 10 || digitos.length > 15) {
    return 'Revisa el celular.';
  }
  if (digitos.startsWith('0')) {
    return 'Revisa el celular.';
  }
  if (/^(\d)\1+$/.test(digitos)) {
    return 'Revisa el celular.';
  }
  return null;
}

export function validarDatosCliente({ nombre, telefono }) {
  const errores = {};

  const nombreLimpio = (nombre ?? '').trim();
  if (!nombreLimpio) {
    errores.nombre = 'Escribe tu nombre completo.';
  } else if (nombreLimpio.length < 2) {
    errores.nombre = 'El nombre debe tener al menos 2 caracteres.';
  } else if (nombreLimpio.length > 120) {
    errores.nombre = 'El nombre no puede superar 120 caracteres.';
  }

  const errorWhatsapp = validarWhatsappCliente(telefono);
  if (errorWhatsapp) errores.telefono = errorWhatsapp;

  return errores;
}

export function pasoParaErroresApi(errores) {
  const campos = Object.keys(errores ?? {});
  if (campos.some((c) => ['fecha', 'hora_inicio', 'servicio_id', 'estilista_id', 'marca_id'].includes(c))) {
    return campos.some((c) => c === 'servicio_id') && campos.length === 1 ? 0 : 1;
  }
  if (campos.some((c) => ['nombre', 'telefono', 'correo'].includes(c))) {
    return 2;
  }
  return null;
}

export function resumenErroresValidacion(errores) {
  const mensajes = Object.values(errores ?? {}).filter(Boolean);
  if (mensajes.length === 0) {
    return { titulo: 'Datos invalidos', mensaje: 'Revisa el formulario e intenta de nuevo.', detalles: [] };
  }
  if (mensajes.length === 1) {
    return { titulo: 'Revisa este campo', mensaje: mensajes[0], detalles: [] };
  }
  return {
    titulo: 'Revisa estos campos',
    mensaje: `Hay ${mensajes.length} campos por corregir:`,
    detalles: mensajes,
  };
}
