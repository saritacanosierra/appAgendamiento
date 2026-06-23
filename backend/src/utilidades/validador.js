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
