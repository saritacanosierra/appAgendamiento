import { VARIABLES_MARCA_DEFECTO } from '../constantes';

/**
 * Aplica variables CSS de la marca al documento.
 */
export function aplicarTemaMarca(marca = {}) {
  const raiz = document.documentElement;
  const colores = { ...VARIABLES_MARCA_DEFECTO, ...marca };

  raiz.style.setProperty('--color-principal', colores.colorPrincipal);
  raiz.style.setProperty('--color-secundario', colores.colorSecundario);
  raiz.style.setProperty('--color-fondo', colores.colorFondo);
  raiz.style.setProperty('--color-texto', colores.colorTexto);
  raiz.style.setProperty(
    '--color-fondo-app',
    `color-mix(in srgb, ${colores.colorSecundario} 14%, ${colores.colorFondo})`
  );
}

export function formatearPrecio(precio, moneda = 'MXN') {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: moneda,
  }).format(precio);
}

export function formatearFecha(fecha) {
  if (!fecha) return '';
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
  }).format(new Date(fecha));
}
