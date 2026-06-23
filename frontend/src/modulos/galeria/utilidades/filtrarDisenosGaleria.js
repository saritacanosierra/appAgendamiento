function normalizar(texto) {
  return (texto ?? '')
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function textoBusqueda(diseno) {
  return [
    diseno.titulo,
    diseno.categoria,
    ...(diseno.coloresRelacionados ?? []),
  ]
    .filter(Boolean)
    .map(normalizar)
    .join(' ');
}

/** Coincide si la búsqueda aparece en título, categoría o colores. */
export function coincideBusqueda(diseno, busqueda) {
  const termino = normalizar(busqueda);
  if (!termino) return true;

  const texto = textoBusqueda(diseno);
  const palabras = termino.split(/\s+/).filter(Boolean);
  return palabras.every((palabra) => texto.includes(palabra));
}

export function filtrarDisenosGaleria(
  disenos,
  { busqueda = '', categoria = 'todas', tendencia = 'todas' } = {}
) {
  return disenos.filter((diseno) => {
    if (categoria !== 'todas') {
      if (normalizar(diseno.categoria) !== normalizar(categoria)) return false;
    }

    if (tendencia === 'tendencia' && !diseno.enTendencia) return false;
    if (tendencia === 'sin-tendencia' && diseno.enTendencia) return false;

    return coincideBusqueda(diseno, busqueda);
  });
}

export function categoriasUnicas(disenos) {
  const mapa = new Map();
  for (const diseno of disenos) {
    const cat = diseno.categoria?.trim();
    if (!cat) continue;
    const clave = normalizar(cat);
    if (!mapa.has(clave)) mapa.set(clave, cat);
  }
  return [...mapa.values()].sort((a, b) => a.localeCompare(b, 'es'));
}
