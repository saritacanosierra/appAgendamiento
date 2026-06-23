import { peticionAdmin } from '../../../compartido/utilidades/apiCliente';

export async function obtenerServiciosAdmin() {
  const respuesta = await peticionAdmin('/admin/servicios');
  return respuesta.datos;
}

export async function crearServicio(datos) {
  const respuesta = await peticionAdmin('/admin/servicios', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function actualizarServicio(id, datos) {
  const respuesta = await peticionAdmin(`/admin/servicios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function eliminarServicio(id) {
  const respuesta = await peticionAdmin(`/admin/servicios/${id}`, {
    method: 'DELETE',
  });
  return respuesta.datos;
}
