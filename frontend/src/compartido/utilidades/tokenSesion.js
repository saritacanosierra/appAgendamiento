import { CLAVE_IMPERSONACION, CLAVE_TOKEN_SESION } from '../constantes';

export function obtenerToken() {
  return localStorage.getItem(CLAVE_TOKEN_SESION);
}

export function guardarToken(token) {
  if (token) {
    localStorage.setItem(CLAVE_TOKEN_SESION, token);
  } else {
    localStorage.removeItem(CLAVE_TOKEN_SESION);
  }
}

export function limpiarToken() {
  localStorage.removeItem(CLAVE_TOKEN_SESION);
  localStorage.removeItem(CLAVE_IMPERSONACION);
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
