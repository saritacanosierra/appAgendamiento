import { peticionPublica } from '../../../compartido/utilidades/apiCliente';

export async function obtenerMarcaPorSlug(slug) {
  const respuesta = await peticionPublica(`/marcas/slug/${encodeURIComponent(slug)}`);
  return respuesta.datos;
}

export async function obtenerServiciosPublicos(marcaId) {
  const respuesta = await peticionPublica(`/marcas/${marcaId}/servicios`);
  return respuesta.datos;
}
