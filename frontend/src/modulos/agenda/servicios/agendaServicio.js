import { peticionAdmin } from '../../../compartido/utilidades/apiCliente';

export async function obtenerAgenda(fecha, vista = 'dia') {
  const params = new URLSearchParams({ fecha, vista });
  const respuesta = await peticionAdmin(`/admin/agenda?${params}`);
  return respuesta.datos;
}

export async function listarCitas(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.fecha) params.set('fecha', filtros.fecha);
  if (filtros.estado) params.set('estado', filtros.estado);
  const qs = params.toString();
  const respuesta = await peticionAdmin(`/admin/citas${qs ? `?${qs}` : ''}`);
  return respuesta.datos;
}

export async function crearCita(datos) {
  const respuesta = await peticionAdmin('/admin/citas', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function actualizarCita(id, datos) {
  const respuesta = await peticionAdmin(`/admin/citas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function cancelarCita(id) {
  const respuesta = await peticionAdmin(`/admin/citas/${id}`, { method: 'DELETE' });
  return respuesta.datos;
}
