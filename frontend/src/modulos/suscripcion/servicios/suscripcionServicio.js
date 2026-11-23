import { peticionAdmin } from '../../../compartido/utilidades/apiCliente';

export async function obtenerPlanMarca() {
  const respuesta = await peticionAdmin('/admin/suscripcion');
  return respuesta.datos;
}

export async function crearPagoWompi(planTipo, opciones = {}) {
  const cuerpo = { plan_tipo: planTipo };
  if (opciones.redirectUrl) cuerpo.redirect_url = opciones.redirectUrl;
  const respuesta = await peticionAdmin('/admin/suscripcion/wompi', {
    method: 'POST',
    body: JSON.stringify(cuerpo),
  });
  return respuesta.datos;
}
