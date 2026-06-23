import { peticionAdmin } from '../../../compartido/utilidades/apiCliente';

export async function obtenerCitasAtencion(fecha) {
  const params = new URLSearchParams();
  if (fecha) params.set('fecha', fecha);
  const query = params.toString();
  const respuesta = await peticionAdmin(`/admin/atencion/citas${query ? `?${query}` : ''}`);
  return respuesta.datos;
}

export async function cerrarServicioAtencion(citaId, datos) {
  const respuesta = await peticionAdmin(`/admin/atencion/citas/${citaId}/cerrar`, {
    method: 'POST',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}
