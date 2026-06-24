/** Primera letra del texto (ignorando espacios iniciales). */
export function capitalizarInicioTexto(valor = '') {
  if (!valor) return valor;
  return valor.replace(/^(\s*)([^\s])/u, (_, espacios, letra) =>
    espacios + letra.toLocaleUpperCase('es')
  );
}

/** Primera letra de cada palabra separada por espacios. */
export function capitalizarPalabrasTexto(valor = '') {
  if (!valor) return valor;
  return valor.replace(/(^|\s+)([^\s])/gu, (_, sep, letra) =>
    sep + letra.toLocaleUpperCase('es')
  );
}

/** Primera letra de cada segmento separado por coma. */
export function capitalizarListaComas(valor = '') {
  if (!valor) return valor;
  return valor
    .split(',')
    .map((parte) => capitalizarInicioTexto(parte))
    .join(',');
}

export function aplicarCapitalizacion(valor, modo = 'inicio') {
  if (modo === false || modo == null) return valor;
  if (modo === 'palabras') return capitalizarPalabrasTexto(valor);
  if (modo === 'lista') return capitalizarListaComas(valor);
  return capitalizarInicioTexto(valor);
}
