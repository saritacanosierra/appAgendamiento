import { peticionAdmin } from '../../../compartido/utilidades/apiCliente';

export async function obtenerReporte(desde, hasta) {
  const params = new URLSearchParams();
  if (desde) params.set('desde', desde);
  if (hasta) params.set('hasta', hasta);
  const query = params.toString();
  const respuesta = await peticionAdmin(`/admin/reportes${query ? `?${query}` : ''}`);
  return respuesta.datos;
}
