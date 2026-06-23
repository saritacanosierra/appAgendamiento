import { peticionAdmin } from '../../../compartido/utilidades/apiCliente';

export async function listarSolicitudesReagendamiento() {
  const respuesta = await peticionAdmin('/admin/solicitudes-reagendamiento');
  return respuesta.datos;
}

export async function aprobarSolicitudReagendamiento(id) {
  const respuesta = await peticionAdmin(`/admin/solicitudes-reagendamiento/${id}/aprobar`, {
    method: 'PUT',
  });
  return respuesta.datos;
}

export async function rechazarSolicitudReagendamiento(id) {
  const respuesta = await peticionAdmin(`/admin/solicitudes-reagendamiento/${id}/rechazar`, {
    method: 'PUT',
  });
  return respuesta.datos;
}
