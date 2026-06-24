/** Normaliza rutas de la app con barra final (excepto la raiz). */
export function conBarraFinal(ruta) {
  if (!ruta) return '/';
  const match = ruta.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  if (!match) return ruta;

  const [, path, query = '', hash = ''] = match;
  if (path === '/' || path.endsWith('/')) {
    return `${path}${query}${hash}`;
  }
  return `${path}/${query}${hash}`;
}

export function esRutaPlataforma(ruta = '') {
  return ruta.startsWith('/plataforma');
}

export function esRutaAdminLogin(ruta = '') {
  const base = ruta.split('?')[0].replace(/\/+$/, '') || '/';
  return base === '/admin';
}

export function esRutaPlataformaLogin(ruta = '') {
  const base = ruta.split('?')[0].replace(/\/+$/, '') || '/';
  return base === '/plataforma';
}

/** URL absoluta del front (origen actual + ruta interna). */
export function urlAbsolutaApp(ruta) {
  const path = conBarraFinal(ruta);
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}
