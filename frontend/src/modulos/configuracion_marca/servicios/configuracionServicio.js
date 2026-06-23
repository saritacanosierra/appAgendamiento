import { peticionAdmin } from '../../../compartido/utilidades/apiCliente';

export async function obtenerConfiguracionMarca() {
  const respuesta = await peticionAdmin('/admin/configuracion-marca');
  return respuesta.datos;
}

export async function actualizarConfiguracionMarca(datos) {
  const respuesta = await peticionAdmin('/admin/configuracion-marca', {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}
