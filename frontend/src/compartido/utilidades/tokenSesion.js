import {
  CLAVE_IMPERSONACION,
  CLAVE_TOKEN_MARCA,
  CLAVE_TOKEN_PLATAFORMA,
  CLAVE_TOKEN_SESION,
  EVENTO_TOKEN_CAMBIADO,
} from '../constantes';

function migrarTokenLegacy() {
  if (typeof localStorage === 'undefined') return;
  const legacy = localStorage.getItem(CLAVE_TOKEN_SESION);
  if (!legacy) return;

  if (!localStorage.getItem(CLAVE_TOKEN_MARCA)) {
    localStorage.setItem(CLAVE_TOKEN_MARCA, legacy);
  }
  if (!localStorage.getItem(CLAVE_TOKEN_PLATAFORMA)) {
    localStorage.setItem(CLAVE_TOKEN_PLATAFORMA, legacy);
  }
  localStorage.removeItem(CLAVE_TOKEN_SESION);
}

migrarTokenLegacy();

function notificarCambioToken(detalle) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENTO_TOKEN_CAMBIADO, { detail: detalle }));
}

export function obtenerTokenMarca() {
  return localStorage.getItem(CLAVE_TOKEN_MARCA);
}

export function obtenerTokenPlataforma() {
  return localStorage.getItem(CLAVE_TOKEN_PLATAFORMA);
}

/** @deprecated Usar obtenerTokenMarca u obtenerTokenPlataforma */
export function obtenerToken() {
  return obtenerTokenMarca() ?? obtenerTokenPlataforma();
}

export function guardarTokenMarca(token) {
  if (token) {
    localStorage.setItem(CLAVE_TOKEN_MARCA, token);
  } else {
    localStorage.removeItem(CLAVE_TOKEN_MARCA);
  }
  notificarCambioToken({ origen: 'guardar', contexto: 'marca' });
}

export function guardarTokenPlataforma(token) {
  if (token) {
    localStorage.setItem(CLAVE_TOKEN_PLATAFORMA, token);
  } else {
    localStorage.removeItem(CLAVE_TOKEN_PLATAFORMA);
  }
  notificarCambioToken({ origen: 'guardar', contexto: 'plataforma' });
}

/** @deprecated Usar guardarTokenMarca o guardarTokenPlataforma */
export function guardarToken(token) {
  guardarTokenMarca(token);
}

export function limpiarTokenMarca() {
  localStorage.removeItem(CLAVE_TOKEN_MARCA);
  localStorage.removeItem(CLAVE_IMPERSONACION);
  notificarCambioToken({ origen: 'limpiar', contexto: 'marca' });
}

export function limpiarTokenPlataforma() {
  localStorage.removeItem(CLAVE_TOKEN_PLATAFORMA);
  notificarCambioToken({ origen: 'limpiar', contexto: 'plataforma' });
}

export function limpiarToken() {
  limpiarTokenMarca();
  limpiarTokenPlataforma();
  localStorage.removeItem(CLAVE_TOKEN_SESION);
  notificarCambioToken({ origen: 'limpiar', contexto: 'todos' });
}

export function marcarImpersonacion(marcaNombre) {
  localStorage.setItem(CLAVE_IMPERSONACION, marcaNombre ?? '1');
}

export function obtenerImpersonacion() {
  return localStorage.getItem(CLAVE_IMPERSONACION);
}

export function limpiarImpersonacion() {
  localStorage.removeItem(CLAVE_IMPERSONACION);
}

export const CLAVES_TOKEN_SESION = [CLAVE_TOKEN_MARCA, CLAVE_TOKEN_PLATAFORMA, CLAVE_TOKEN_SESION];
