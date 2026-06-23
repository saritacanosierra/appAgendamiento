/** Convierte filas snake_case de MySQL a camelCase para el frontend. */
export function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function filaACamelCase(fila) {
  if (!fila) return null;
  const resultado = {};
  for (const [clave, valor] of Object.entries(fila)) {
    resultado[snakeToCamel(clave)] = valor;
  }
  return resultado;
}

export function parsearJsonCampo(valor, defecto = null) {
  if (valor === null || valor === undefined) return defecto;
  if (typeof valor === 'object') return valor;
  try {
    return JSON.parse(valor);
  } catch {
    return defecto;
  }
}
