import { peticionAdmin, peticionPlataforma, peticionPublica } from '../../../compartido/utilidades/apiCliente';
import {
  guardarTokenMarca,
  guardarTokenPlataforma,
  limpiarImpersonacion,
  limpiarTokenMarca,
  limpiarTokenPlataforma,
} from '../../../compartido/utilidades/tokenSesion';

export async function iniciarSesion(correo, contrasena, contexto = 'marca') {
  const respuesta = await peticionPublica('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ correo, contrasena }),
  });

  if (contexto === 'plataforma') {
    guardarTokenPlataforma(respuesta.datos.token);
  } else {
    limpiarImpersonacion();
    guardarTokenMarca(respuesta.datos.token);
  }

  return respuesta.datos;
}

export async function solicitarRecuperacion(correo, celular, contexto = 'marca') {
  const respuesta = await peticionPublica('/auth/recuperar-contrasena', {
    method: 'POST',
    body: JSON.stringify({ correo, celular, contexto }),
  });
  return respuesta;
}

export async function restablecerContrasena(token, contrasena) {
  const respuesta = await peticionPublica('/auth/restablecer-contrasena', {
    method: 'POST',
    body: JSON.stringify({ token, contrasena }),
  });
  return respuesta.datos;
}

export async function cerrarSesion(contexto = 'marca') {
  try {
    if (contexto === 'plataforma') {
      await peticionPlataforma('/auth/logout', { method: 'POST' });
    } else {
      await peticionAdmin('/auth/logout', { method: 'POST' });
    }
  } finally {
    if (contexto === 'plataforma') {
      limpiarTokenPlataforma();
    } else {
      limpiarTokenMarca();
    }
  }
}

export async function obtenerSesionMarca() {
  return peticionAdmin('/auth/me');
}

export async function obtenerSesionPlataforma() {
  return peticionPlataforma('/auth/me');
}

/** @deprecated Usar obtenerSesionMarca u obtenerSesionPlataforma */
export async function obtenerSesionActual() {
  return obtenerSesionMarca();
}
