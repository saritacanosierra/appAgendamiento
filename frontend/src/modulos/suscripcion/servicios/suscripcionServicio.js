import { peticionAdmin } from '../../../compartido/utilidades/apiCliente';

export async function obtenerPlanMarca() {
  const respuesta = await peticionAdmin('/admin/suscripcion');
  return respuesta.datos;
}

export async function crearPagoWompi(planTipo) {
  const respuesta = await peticionAdmin('/admin/suscripcion/wompi', {
    method: 'POST',
    body: JSON.stringify({ plan_tipo: planTipo }),
  });
  return respuesta.datos;
}
