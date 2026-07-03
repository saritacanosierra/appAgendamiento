import { API_BASE_URL } from '../constantes';

function origenArchivosBackend() {
  const origenExplicito = import.meta.env.VITE_MEDIA_ORIGIN?.trim();
  if (origenExplicito) return origenExplicito.replace(/\/$/, '');

  const api = API_BASE_URL.replace(/\/$/, '');
  if (!api || api === '/api') return '';

  if (api.endsWith('/api')) {
    return api.slice(0, -4);
  }

  try {
    return new URL(api).origin;
  } catch {
    return '';
  }
}

/**
 * Convierte rutas relativas /subidas/... al origen del backend en produccion.
 * En desarrollo Vite hace proxy de /subidas al API local.
 */
export function resolverUrlMedia(ruta) {
  if (ruta == null) return '';
  const valor = String(ruta).trim();
  if (!valor) return '';

  if (/^https?:\/\//i.test(valor)) return valor;

  const rutaNormalizada = valor.startsWith('/') ? valor : `/${valor}`;
  if (!rutaNormalizada.startsWith('/subidas/')) return valor;

  const origen = origenArchivosBackend();
  return origen ? `${origen}${rutaNormalizada}` : rutaNormalizada;
}
