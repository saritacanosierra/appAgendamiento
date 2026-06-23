import { CLAVE_TOKEN_SESION } from '../constantes';

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
}
