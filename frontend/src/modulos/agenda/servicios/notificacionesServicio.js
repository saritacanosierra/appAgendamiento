import { peticionAdmin } from '../../../compartido/utilidades/apiCliente';

export async function obtenerResumenNotificaciones() {
  const respuesta = await peticionAdmin('/admin/notificaciones/resumen');
  return respuesta.datos;
}

export async function listarNotificaciones(soloNoLeidas = false) {
  const params = soloNoLeidas ? '?solo_no_leidas=1' : '';
  const respuesta = await peticionAdmin(`/admin/notificaciones${params}`);
  return respuesta.datos;
}

export async function marcarNotificacionLeida(id) {
  const respuesta = await peticionAdmin(`/admin/notificaciones/${id}/leida`, {
    method: 'PUT',
  });
  return respuesta.datos;
}

export async function marcarTodasNotificacionesLeidas() {
  const respuesta = await peticionAdmin('/admin/notificaciones/marcar-todas-leidas', {
    method: 'PUT',
  });
  return respuesta.datos;
}
