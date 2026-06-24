export function capitalizarInicioTexto(valor = '') {
  const texto = String(valor ?? '');
  if (!texto) return texto;
  return texto.replace(/^(\s*)([^\s])/u, (_, espacios, letra) =>
    espacios + letra.toLocaleUpperCase('es')
  );
}

export function capitalizarPalabrasTexto(valor = '') {
  const texto = String(valor ?? '');
  if (!texto) return texto;
  return texto.replace(/(^|\s+)([^\s])/gu, (_, sep, letra) =>
    sep + letra.toLocaleUpperCase('es')
  );
}

export function capitalizarListaComas(valor = '') {
  const texto = String(valor ?? '');
  if (!texto) return texto;
  return texto
    .split(',')
    .map((parte) => capitalizarInicioTexto(parte.trim()))
    .filter(Boolean)
    .join(', ');
}

export function aplicarCapitalizacion(valor, modo = 'inicio') {
  if (!valor || modo === false) return valor;
  if (modo === 'palabras') return capitalizarPalabrasTexto(valor);
  if (modo === 'lista') return capitalizarListaComas(valor);
  return capitalizarInicioTexto(valor);
}
