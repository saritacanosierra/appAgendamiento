import { peticionAdmin } from '../../../compartido/utilidades/apiCliente';

export async function obtenerServiciosAdmin(tipo) {
  const params = tipo ? `?tipo=${encodeURIComponent(tipo)}` : '';
  const respuesta = await peticionAdmin(`/admin/servicios${params}`);
  return respuesta.datos;
}

export async function obtenerServiciosAdicionalesActivos() {
  const respuesta = await peticionAdmin('/admin/servicios/adicionales');
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
