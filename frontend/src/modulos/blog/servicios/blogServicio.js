import { peticionAdmin, peticionPublica } from '../../../compartido/utilidades/apiCliente';

export async function listarBlogPublico(marcaId) {
  const respuesta = await peticionPublica(`/marcas/${marcaId}/blog`);
  return respuesta.datos;
}

export async function obtenerBlogPublico(marcaId, slug) {
  const respuesta = await peticionPublica(
    `/marcas/${marcaId}/blog/slug/${encodeURIComponent(slug)}`
  );
  return respuesta.datos;
}

export async function listarBlogAdmin() {
  const respuesta = await peticionAdmin('/admin/blog');
  return respuesta.datos;
}

export async function crearPublicacion(datos) {
  const respuesta = await peticionAdmin('/admin/blog', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function actualizarPublicacion(id, datos) {
  const respuesta = await peticionAdmin(`/admin/blog/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}
