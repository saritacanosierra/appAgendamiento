import { peticionPublica } from '../../../compartido/utilidades/apiCliente';

export async function iniciarSesionGaleria(marcaId, telefono) {
  const respuesta = await peticionPublica(`/marcas/${marcaId}/galeria/sesion`, {
    method: 'POST',
    body: JSON.stringify({ telefono }),
  });
  return respuesta.datos;
}

export async function listarSeleccionesGaleria(marcaId, { telefono }) {
  const params = new URLSearchParams({ telefono });
  const respuesta = await peticionPublica(
    `/marcas/${marcaId}/galeria/selecciones?${params}`
  );
  return respuesta.datos;
}

export async function agregarSeleccionGaleria(marcaId, { telefono, disenoId }) {
  const respuesta = await peticionPublica(`/marcas/${marcaId}/galeria/selecciones`, {
    method: 'POST',
    body: JSON.stringify({
      telefono,
      diseno_id: disenoId,
    }),
  });
  return respuesta.datos;
}

export async function quitarSeleccionGaleria(marcaId, { telefono, disenoId }) {
  const respuesta = await peticionPublica(`/marcas/${marcaId}/galeria/selecciones`, {
    method: 'DELETE',
    body: JSON.stringify({
      telefono,
      diseno_id: disenoId,
    }),
  });
  return respuesta.datos;
}
