export function requerido(valor, campo) {
  if (valor === null || valor === undefined || (typeof valor === 'string' && valor.trim() === '')) {
    return `El campo ${campo} es obligatorio.`;
  }
  return null;
}

export function email(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === '') return null;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(valor) ? null : 'El correo electronico no es valido.';
}

export function telefono(valor) {
  const limpio = String(valor ?? '').replace(/\D+/g, '');
  return limpio.length >= 10 ? null : 'El telefono debe tener al menos 10 digitos.';
}

/** WhatsApp de clienta final: solo digitos, sin letras y sin secuencias falsas. */
export function whatsappCliente(valor) {
  const original = String(valor ?? '').trim();
  if (!original) return 'El WhatsApp es obligatorio.';
  if (/[a-zA-Z]/.test(original)) {
    return 'El WhatsApp solo puede incluir numeros, espacios, guiones y +.';
  }
  const digitos = original.replace(/\D+/g, '');
  if (digitos.length < 10 || digitos.length > 15) {
    return 'Ingresa un WhatsApp valido de 10 a 15 digitos. Ejemplo: 300 123 4567.';
  }
  if (digitos.startsWith('0')) {
    return 'El WhatsApp no puede empezar por 0. Ejemplo: 300 123 4567.';
  }
  if (/^(\d)\1+$/.test(digitos)) {
    return 'Ese numero de WhatsApp no es valido.';
  }
  return null;
}

export function slug(valor) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(valor)
    ? null
    : 'El slug solo puede contener letras minusculas, numeros y guiones.';
}

export function validar(datos, reglas) {
  const errores = {};
  for (const [campo, validacion] of Object.entries(reglas)) {
    const error = validacion(datos[campo]);
    if (error) errores[campo] = error;
  }
  return errores;
}
