import { peticionAdmin, peticionPublica } from '../../../compartido/utilidades/apiCliente';

export async function listarEstilistasPublicas(marcaId) {
  const respuesta = await peticionPublica(`/marcas/${marcaId}/estilistas`);
  return respuesta.datos;
}

export async function listarPortafolioPublico(marcaId) {
  const respuesta = await peticionPublica(`/marcas/${marcaId}/portafolio`);
  return Array.isArray(respuesta.datos) ? respuesta.datos : [];
}

export async function listarEstilistasAdmin() {
  const respuesta = await peticionAdmin('/admin/estilistas');
  return respuesta.datos;
}

export async function crearEstilista(datos) {
  const respuesta = await peticionAdmin('/admin/estilistas', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function actualizarEstilista(id, datos) {
  const respuesta = await peticionAdmin(`/admin/estilistas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}
