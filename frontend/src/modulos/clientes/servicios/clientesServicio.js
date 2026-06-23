import { peticionAdmin } from '../../../compartido/utilidades/apiCliente';

export async function listarClientes(busqueda = '') {
  const params = busqueda ? `?busqueda=${encodeURIComponent(busqueda)}` : '';
  const respuesta = await peticionAdmin(`/admin/clientes${params}`);
  return respuesta.datos;
}

export async function crearCliente(datos) {
  const respuesta = await peticionAdmin('/admin/clientes', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}
