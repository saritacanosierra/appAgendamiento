/**
 * Origen publico del API (Render expone RENDER_EXTERNAL_URL automaticamente).
 */
export function origenPublicoApi() {
  const explicito = (process.env.PUBLIC_URL_BASE ?? '').trim().replace(/\/$/, '');
  if (explicito) return explicito;

  const render = (process.env.RENDER_EXTERNAL_URL ?? '').trim().replace(/\/$/, '');
  if (render) return render;

  return '';
}

/**
 * Convierte /subidas/... en URL absoluta para clientes en otro dominio (Imagina).
 */
export function resolverRutaMedia(ruta) {
  if (ruta == null || ruta === '') return ruta;

  const valor = String(ruta).trim();
  if (!valor) return valor;
  if (/^https?:\/\//i.test(valor)) return valor;

  const normalizada = valor.startsWith('/') ? valor : `/${valor}`;
  if (!normalizada.startsWith('/subidas/')) return valor;

  const origen = origenPublicoApi();
  return origen ? `${origen}${normalizada}` : normalizada;
}

/** Guarda en BD solo la ruta relativa aunque el cliente envie URL absoluta. */
export function normalizarRutaMediaAlmacenamiento(ruta) {
  if (ruta == null || ruta === '') return ruta;

  const valor = String(ruta).trim();
  if (!valor) return null;
  if (!/^https?:\/\//i.test(valor)) {
    return valor.startsWith('/') ? valor : `/${valor}`;
  }

  try {
    const pathname = new URL(valor).pathname;
    const indice = pathname.indexOf('/subidas/');
    if (indice >= 0) return pathname.slice(indice);
  } catch {
    /* mantener valor */
  }

  return valor;
}
