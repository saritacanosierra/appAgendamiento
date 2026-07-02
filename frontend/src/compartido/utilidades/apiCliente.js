import { API_BASE_URL, EVENTO_TOKEN_CAMBIADO } from '../constantes';
import {
  guardarTokenMarca,
  guardarTokenPlataforma,
  obtenerTokenMarca,
  obtenerTokenPlataforma,
} from './tokenSesion';

function esConflictoSesionPlataforma(mensaje) {
  const texto = String(mensaje ?? '').toLowerCase();
  return (
    texto.includes('superadministradores') ||
    texto.includes('panel /plataforma') ||
    texto.includes('sesion es de plataforma')
  );
}

function notificarConflictoSesionPlataforma() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(EVENTO_TOKEN_CAMBIADO, { detail: { conflictoPlataforma: true } })
  );
}

function crearRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `web-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function cabecerasRequestId(extra = {}) {
  return {
    'X-Request-Id': crearRequestId(),
    ...extra,
  };
}

function aplicarTokenRotado(respuesta, contexto = 'marca') {
  const nuevoToken = respuesta.headers.get('X-Nuevo-Token');
  if (!nuevoToken) return;

  if (contexto === 'plataforma') {
    guardarTokenPlataforma(nuevoToken);
  } else {
    guardarTokenMarca(nuevoToken);
  }
}

/**
 * Cliente HTTP base para comunicacion con la API Node.js.
 */
export async function peticionApi(ruta, opciones = {}) {
  const contexto = opciones.contexto ?? 'marca';
  const url = ruta.startsWith('http') ? ruta : `${API_BASE_URL}${ruta}`;
  const requiereAuth = opciones.autenticado !== false;
  const token = contexto === 'plataforma' ? obtenerTokenPlataforma() : obtenerTokenMarca();

  const respuesta = await fetch(url, {
    credentials: 'include',
    headers: cabecerasRequestId({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(requiereAuth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...opciones.headers,
    }),
    ...opciones,
  });

  aplicarTokenRotado(respuesta, contexto);

  const datos = await respuesta.json().catch(() => ({
    exito: false,
    mensaje: 'Respuesta invalida del servidor.',
  }));

  if (!respuesta.ok) {
    const error = new Error(datos.mensaje || 'Error en la peticion');
    error.datos = datos;
    error.codigoHttp = respuesta.status;
    if (respuesta.status === 403 && esConflictoSesionPlataforma(datos.mensaje)) {
      error.conflictoPlataforma = true;
      notificarConflictoSesionPlataforma();
    }
    throw error;
  }

  return datos;
}

export async function obtenerEstadoApi() {
  return peticionApi('/estado', { autenticado: false });
}

export async function peticionPublica(ruta, opciones = {}) {
  return peticionApi(ruta, { ...opciones, autenticado: false });
}

export async function peticionAdmin(ruta, opciones = {}) {
  return peticionApi(ruta, { ...opciones, autenticado: true, contexto: 'marca' });
}

export async function peticionPlataforma(ruta, opciones = {}) {
  return peticionApi(ruta, { ...opciones, autenticado: true, contexto: 'plataforma' });
}

export async function peticionAdminFormData(ruta, formData, method = 'POST') {
  const url = ruta.startsWith('http') ? ruta : `${API_BASE_URL}${ruta}`;
  const token = obtenerTokenMarca();

  const respuesta = await fetch(url, {
    method,
    credentials: 'include',
    headers: cabecerasRequestId({
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    body: formData,
  });

  aplicarTokenRotado(respuesta, 'marca');

  const datos = await respuesta.json().catch(() => ({
    exito: false,
    mensaje: 'Respuesta invalida del servidor.',
  }));

  if (!respuesta.ok) {
    const error = new Error(datos.mensaje || 'Error en la peticion');
    error.datos = datos;
    error.codigoHttp = respuesta.status;
    if (respuesta.status === 403 && esConflictoSesionPlataforma(datos.mensaje)) {
      error.conflictoPlataforma = true;
      notificarConflictoSesionPlataforma();
    }
    throw error;
  }

  return datos;
}

export async function subirImagenAdmin(carpeta, archivo) {
  const formData = new FormData();
  formData.append('archivo', archivo);
  const respuesta = await peticionAdminFormData(`/admin/subidas/${carpeta}`, formData);
  return respuesta.datos;
}
