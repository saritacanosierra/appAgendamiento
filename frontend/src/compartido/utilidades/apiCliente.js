import { API_BASE_URL } from '../constantes';
import { obtenerToken, guardarToken } from './tokenSesion';

function aplicarTokenRotado(respuesta) {
  const nuevoToken = respuesta.headers.get('X-Nuevo-Token');
  if (nuevoToken) {
    guardarToken(nuevoToken);
  }
}

/**
 * Cliente HTTP base para comunicacion con la API Node.js.
 */
export async function peticionApi(ruta, opciones = {}) {
  const url = ruta.startsWith('http') ? ruta : `${API_BASE_URL}${ruta}`;
  const token = obtenerToken();
  const requiereAuth = opciones.autenticado !== false;

  const respuesta = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(requiereAuth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...opciones.headers,
    },
    ...opciones,
  });

  aplicarTokenRotado(respuesta);

  const datos = await respuesta.json().catch(() => ({
    exito: false,
    mensaje: 'Respuesta invalida del servidor.',
  }));

  if (!respuesta.ok) {
    const error = new Error(datos.mensaje || 'Error en la peticion');
    error.datos = datos;
    error.codigoHttp = respuesta.status;
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
  return peticionApi(ruta, { ...opciones, autenticado: true });
}

export async function peticionAdminFormData(ruta, formData, method = 'POST') {
  const url = ruta.startsWith('http') ? ruta : `${API_BASE_URL}${ruta}`;
  const token = obtenerToken();

  const respuesta = await fetch(url, {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  aplicarTokenRotado(respuesta);

  const datos = await respuesta.json().catch(() => ({
    exito: false,
    mensaje: 'Respuesta invalida del servidor.',
  }));

  if (!respuesta.ok) {
    const error = new Error(datos.mensaje || 'Error en la peticion');
    error.datos = datos;
    error.codigoHttp = respuesta.status;
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
