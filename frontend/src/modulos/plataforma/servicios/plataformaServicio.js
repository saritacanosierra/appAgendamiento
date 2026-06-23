import { peticionAdmin } from '../../../compartido/utilidades/apiCliente';

export async function obtenerResumenPlataforma() {
  const respuesta = await peticionAdmin('/plataforma/resumen');
  return respuesta.datos;
}

export async function listarMarcasPlataforma() {
  const respuesta = await peticionAdmin('/plataforma/marcas');
  return respuesta.datos.marcas;
}

export async function obtenerMarcaPlataforma(id) {
  const respuesta = await peticionAdmin(`/plataforma/marcas/${id}`);
  return respuesta.datos.marca;
}

export async function crearMarcaPlataforma(datos) {
  const respuesta = await peticionAdmin('/plataforma/marcas', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function actualizarMarcaPlataforma(id, datos) {
  const respuesta = await peticionAdmin(`/plataforma/marcas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function impersonarMarcaPlataforma(id) {
  const respuesta = await peticionAdmin(`/plataforma/marcas/${id}/impersonar`, {
    method: 'POST',
  });
  return respuesta.datos;
}

export async function obtenerReportePlataforma(desde, hasta) {
  const params = new URLSearchParams();
  if (desde) params.set('desde', desde);
  if (hasta) params.set('hasta', hasta);
  const query = params.toString();
  const respuesta = await peticionAdmin(`/plataforma/reportes${query ? `?${query}` : ''}`);
  return respuesta.datos;
}

export async function resetearContrasenaMarcaPlataforma(id, nuevaContrasena) {
  const respuesta = await peticionAdmin(`/plataforma/marcas/${id}/reset-contrasena`, {
    method: 'PUT',
    body: JSON.stringify({ nueva_contrasena: nuevaContrasena }),
  });
  return respuesta.datos;
}
