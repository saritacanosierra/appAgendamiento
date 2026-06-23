import { peticionAdmin, peticionPublica } from '../../../compartido/utilidades/apiCliente';
import { guardarToken, limpiarToken } from '../../../compartido/utilidades/tokenSesion';

export async function iniciarSesion(correo, contrasena) {
  const respuesta = await peticionPublica('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ correo, contrasena }),
  });

  guardarToken(respuesta.datos.token);
  return respuesta.datos;
}

export async function cerrarSesion() {
  try {
    await peticionAdmin('/auth/logout', { method: 'POST' });
  } finally {
    limpiarToken();
  }
}

export async function obtenerSesionActual() {
  return peticionAdmin('/auth/me');
}
