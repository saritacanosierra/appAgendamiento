const RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validarDatosCliente({ nombre, telefono, correo }) {
  const errores = {};

  const nombreLimpio = (nombre ?? '').trim();
  if (!nombreLimpio) {
    errores.nombre = 'Escribe tu nombre completo.';
  } else if (nombreLimpio.length < 2) {
    errores.nombre = 'El nombre debe tener al menos 2 caracteres.';
  } else if (nombreLimpio.length > 120) {
    errores.nombre = 'El nombre no puede superar 120 caracteres.';
  }

  const telefonoLimpio = (telefono ?? '').trim();
  const digitosTelefono = telefonoLimpio.replace(/\D+/g, '');
  if (!telefonoLimpio) {
    errores.telefono = 'El telefono es obligatorio.';
  } else if (digitosTelefono.length < 10) {
    errores.telefono =
      'Ingresa al menos 10 digitos. Puedes usar espacios o +57. Ejemplo: 300 123 4567.';
  } else if (digitosTelefono.length > 15) {
    errores.telefono = 'El telefono no puede tener mas de 15 digitos.';
  }

  const correoLimpio = (correo ?? '').trim();
  if (!correoLimpio) {
    errores.correo = 'El correo electronico es obligatorio.';
  } else if (!RE_CORREO.test(correoLimpio)) {
    errores.correo = 'Formato invalido. Ejemplo: tu@correo.com';
  } else if (correoLimpio.length > 254) {
    errores.correo = 'El correo es demasiado largo.';
  }

  return errores;
}

export function pasoParaErroresApi(errores) {
  const campos = Object.keys(errores ?? {});
  if (campos.some((c) => ['fecha', 'hora_inicio', 'servicio_id', 'marca_id'].includes(c))) {
    return 1;
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
