import { peticionAdmin, peticionPublica } from '../../../compartido/utilidades/apiCliente';

export async function listarGaleriaPublica(marcaId) {
  const respuesta = await peticionPublica(`/marcas/${marcaId}/galeria`);
  return respuesta.datos;
}

export async function listarGaleriaAdmin() {
  const respuesta = await peticionAdmin('/admin/galeria');
  return respuesta.datos;
}

export async function crearDiseno(datos) {
  const respuesta = await peticionAdmin('/admin/galeria', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function actualizarDiseno(id, datos) {
  const respuesta = await peticionAdmin(`/admin/galeria/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}
