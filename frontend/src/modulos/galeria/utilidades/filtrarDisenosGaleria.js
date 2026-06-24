import {
  catalogoActivoPorTipo,
  etiquetaDesdeCatalogo,
} from '../constantes/galeriaCatalogo.js';

function normalizar(texto) {
  return (texto ?? '')
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function textoBusqueda(diseno, catalogo = []) {
  return [
    diseno.titulo,
    diseno.categoria,
    diseno.temporada,
    etiquetaDesdeCatalogo(diseno.categoria, catalogo),
    etiquetaDesdeCatalogo(diseno.temporada, catalogo),
    ...(diseno.coloresRelacionados ?? []),
  ]
    .filter(Boolean)
    .map(normalizar)
    .join(' ');
}

export function coincideBusqueda(diseno, busqueda, catalogo = []) {
  const termino = normalizar(busqueda);
  if (!termino) return true;

  const texto = textoBusqueda(diseno, catalogo);
  const palabras = termino.split(/\s+/).filter(Boolean);
  return palabras.every((palabra) => texto.includes(palabra));
}

export function filtrarDisenosGaleria(
  disenos,
  {
    busqueda = '',
    categoria = 'todas',
    temporada = 'todas',
    tendencia = 'todas',
    catalogo = [],
  } = {}
) {
  return disenos.filter((diseno) => {
    if (categoria !== 'todas') {
      if (normalizar(diseno.categoria) !== normalizar(categoria)) return false;
    }

    if (temporada !== 'todas') {
      if (temporada === 'sin-temporada') {
        if (diseno.temporada) return false;
      } else if (normalizar(diseno.temporada) !== normalizar(temporada)) {
        return false;
      }
    }

    if (tendencia === 'tendencia' && !diseno.enTendencia) return false;
    if (tendencia === 'sin-tendencia' && diseno.enTendencia) return false;

    return coincideBusqueda(diseno, busqueda, catalogo);
  });
}

function valoresFiltro(disenos, catalogo, tipo) {
  const mapa = new Map();

  for (const item of catalogoActivoPorTipo(catalogo, tipo)) {
    mapa.set(normalizar(item.valor), item.valor);
  }

  const campo = tipo === 'categoria' ? 'categoria' : 'temporada';
  for (const diseno of disenos) {
    const valor = diseno[campo]?.trim();
    if (!valor) continue;
    const clave = normalizar(valor);
    if (!mapa.has(clave)) mapa.set(clave, valor);
  }

  return [...mapa.values()].sort((a, b) =>
    etiquetaDesdeCatalogo(a, catalogo).localeCompare(etiquetaDesdeCatalogo(b, catalogo), 'es')
  );
}

export function categoriasUnicas(disenos, catalogo = []) {
  return valoresFiltro(disenos, catalogo, 'categoria');
}

export function temporadasUnicas(disenos, catalogo = []) {
  return valoresFiltro(disenos, catalogo, 'temporada');
}

export { etiquetaDesdeCatalogo };
