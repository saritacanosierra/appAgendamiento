import { peticionAdmin } from '../../../compartido/utilidades/apiCliente';

export async function obtenerPlanMarca() {
  const respuesta = await peticionAdmin('/admin/suscripcion');
  return respuesta.datos;
}

export async function crearPagoWompi() {
  const respuesta = await peticionAdmin('/admin/suscripcion/wompi', { method: 'POST' });
  return respuesta.datos;
}
