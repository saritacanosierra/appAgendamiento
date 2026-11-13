import { peticionPlataforma, peticionPlataformaFormData } from '../../../compartido/utilidades/apiCliente';

export async function obtenerResumenPlataforma() {
  const respuesta = await peticionPlataforma('/plataforma/resumen');
  return respuesta.datos;
}

export async function listarMarcasPlataforma() {
  const respuesta = await peticionPlataforma('/plataforma/marcas');
  return respuesta.datos.marcas;
}

export async function eliminarMarcaPlataforma(id) {
  const respuesta = await peticionPlataforma(`/plataforma/marcas/${id}`, {
    method: 'DELETE',
  });
  return respuesta.datos;
}

export async function obtenerMarcaPlataforma(id) {
  const respuesta = await peticionPlataforma(`/plataforma/marcas/${id}`);
  return respuesta.datos.marca;
}

export async function crearMarcaPlataforma(datos) {
  const respuesta = await peticionPlataforma('/plataforma/marcas', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function actualizarMarcaPlataforma(id, datos) {
  const respuesta = await peticionPlataforma(`/plataforma/marcas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function impersonarMarcaPlataforma(id) {
  const respuesta = await peticionPlataforma(`/plataforma/marcas/${id}/impersonar`, {
    method: 'POST',
  });
  return respuesta.datos;
}

export async function obtenerReportePlataforma(desde, hasta) {
  const params = new URLSearchParams();
  if (desde) params.set('desde', desde);
  if (hasta) params.set('hasta', hasta);
  const query = params.toString();
  const respuesta = await peticionPlataforma(`/plataforma/reportes${query ? `?${query}` : ''}`);
  return respuesta.datos;
}

export async function resetearContrasenaMarcaPlataforma(id, nuevaContrasena) {
  const respuesta = await peticionPlataforma(`/plataforma/marcas/${id}/reset-contrasena`, {
    method: 'PUT',
    body: JSON.stringify({ nueva_contrasena: nuevaContrasena }),
  });
  return respuesta.datos;
}

export async function activarSuscripcionMarcaPlataforma(id, datos) {
  const respuesta = await peticionPlataforma(`/plataforma/marcas/${id}/suscripcion/activar`, {
    method: 'POST',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function renovarSuscripcionMarcaPlataforma(id, datos) {
  const respuesta = await peticionPlataforma(`/plataforma/marcas/${id}/suscripcion/renovar`, {
    method: 'POST',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function subirImagenPublicidad(archivo) {
  const formData = new FormData();
  formData.append('archivo', archivo);
  const respuesta = await peticionPlataformaFormData('/plataforma/subidas/publicidad', formData);
  return respuesta.datos.ruta;
}

export async function listarPublicacionesParaPublicidad() {
  const respuesta = await peticionPlataforma('/plataforma/publicidad/publicaciones');
  return respuesta.datos.publicaciones;
}

export async function listarPublicidadPlataforma() {
  const respuesta = await peticionPlataforma('/plataforma/publicidad');
  return respuesta.datos.anuncios;
}

export async function crearPublicidadPlataforma(datos) {
  const respuesta = await peticionPlataforma('/plataforma/publicidad', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
  return respuesta.datos.anuncio;
}

export async function actualizarPublicidadPlataforma(id, datos) {
  const respuesta = await peticionPlataforma(`/plataforma/publicidad/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
  return respuesta.datos.anuncio;
}

export async function listarHistorialSuscripcionMarcaPlataforma(id) {
  const respuesta = await peticionPlataforma(`/plataforma/marcas/${id}/suscripcion/historial`);
  return respuesta.datos.historial;
}
