import { peticionAdmin } from '../../../compartido/utilidades/apiCliente';

export async function obtenerEstadoGoogleCalendar() {
  const respuesta = await peticionAdmin('/admin/integraciones/google');
  return respuesta.datos;
}

export async function iniciarAutorizacionGoogle() {
  const respuesta = await peticionAdmin('/admin/integraciones/google/autorizar', {
    method: 'POST',
  });
  return respuesta.datos;
}

export async function desconectarGoogleCalendar() {
  const respuesta = await peticionAdmin('/admin/integraciones/google', {
    method: 'DELETE',
  });
  return respuesta.datos;
}
