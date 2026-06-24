import { aplicarCapitalizacion } from './capitalizarTexto.js';

export function texto(valor, { capitalizar = false } = {}) {
  if (valor === null || valor === undefined) return '';
  const limpio = String(valor).trim().replace(/<[^>]*>/g, '');
  if (!capitalizar || !limpio) return limpio;
  return aplicarCapitalizacion(limpio, capitalizar);
}

export function entero(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  return Number.isInteger(n) ? n : null;
}

export function booleano(valor) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'string') {
    return ['1', 'true', 'si', 'yes', 'on'].includes(valor.toLowerCase());
  }
  return Boolean(valor);
}

export function limpiarObjeto(datos) {
  const limpio = {};
  for (const [clave, valor] of Object.entries(datos)) {
    if (typeof valor === 'string') {
      limpio[clave] = texto(valor);
    } else if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
      limpio[clave] = limpiarObjeto(valor);
    } else {
      limpio[clave] = valor;
    }
  }
  return limpio;
}
