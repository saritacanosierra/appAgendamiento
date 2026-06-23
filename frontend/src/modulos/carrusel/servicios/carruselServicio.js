import { peticionAdmin, peticionPublica } from '../../../compartido/utilidades/apiCliente';

export async function listarCarruselPublico(marcaId) {
  const respuesta = await peticionPublica(`/marcas/${marcaId}/carrusel-inicio`);
  return respuesta.datos;
}

export async function listarCarruselAdmin() {
  const respuesta = await peticionAdmin('/admin/carrusel-inicio');
  return respuesta.datos;
}

export async function crearDiapositivaCarrusel(datos) {
  const respuesta = await peticionAdmin('/admin/carrusel-inicio', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function actualizarDiapositivaCarrusel(id, datos) {
  const respuesta = await peticionAdmin(`/admin/carrusel-inicio/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}
