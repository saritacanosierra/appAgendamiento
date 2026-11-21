import { peticionPlataforma, peticionPlataformaFormData } from '../../../compartido/utilidades/apiCliente';
import { API_BASE_URL } from '../../../compartido/constantes';
import { obtenerTokenPlataforma } from '../../../compartido/utilidades/tokenSesion';

export async function obtenerResumenPlataforma() {
  const respuesta = await peticionPlataforma('/plataforma/resumen');
  return respuesta.datos;
}

export async function obtenerWompiPlataforma() {
  const respuesta = await peticionPlataforma('/plataforma/wompi');
  return respuesta.datos;
}

export async function guardarWompiPlataforma(datos) {
  const respuesta = await peticionPlataforma('/plataforma/wompi', {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
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

export async function listarBlogPlataforma() {
  const respuesta = await peticionPlataforma('/plataforma/blog');
  return respuesta.datos;
}

export async function crearBlogPlataforma(datos) {
  const respuesta = await peticionPlataforma('/plataforma/blog', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function actualizarBlogPlataforma(id, datos) {
  const respuesta = await peticionPlataforma(`/plataforma/blog/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function eliminarBlogPlataforma(id) {
  const respuesta = await peticionPlataforma(`/plataforma/blog/${id}`, { method: 'DELETE' });
  return respuesta.datos;
}

export async function subirImagenBlogPlataforma(archivo) {
  const formData = new FormData();
  formData.append('archivo', archivo);
  const respuesta = await peticionPlataformaFormData('/plataforma/subidas/blog', formData);
  return respuesta.datos.ruta;
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

export async function listarCopiasPlataforma() {
  const respuesta = await peticionPlataforma('/plataforma/copias');
  return respuesta.datos.copias;
}

export async function listarCopiasMarca(id) {
  const respuesta = await peticionPlataforma(`/plataforma/marcas/${id}/copias`);
  return respuesta.datos.copias;
}

export async function guardarCopiaMarca(id) {
  const respuesta = await peticionPlataforma(`/plataforma/marcas/${id}/copias`, { method: 'POST' });
  return respuesta.datos.copia;
}

export async function subirCopiaMarca(archivo) {
  const formData = new FormData();
  formData.append('archivo', archivo);
  const respuesta = await peticionPlataformaFormData('/plataforma/copias', formData);
  return respuesta.datos.copia;
}

export async function eliminarCopiaPlataforma(archivo) {
  const respuesta = await peticionPlataforma(`/plataforma/copias/${archivo}`, { method: 'DELETE' });
  return respuesta.datos;
}

export async function restaurarCopiaMarca(archivo) {
  const respuesta = await peticionPlataforma(`/plataforma/copias/${archivo}/restaurar`, { method: 'POST' });
  return respuesta.datos.restauracion;
}

export async function restaurarCopiaDeMarca(id, archivo) {
  const respuesta = await peticionPlataforma(`/plataforma/marcas/${id}/copias/${archivo}/restaurar`, {
    method: 'POST',
  });
  return respuesta.datos.restauracion;
}

export async function descargarCopiaMarca(archivo, nombreArchivo) {
  const token = obtenerTokenPlataforma();
  const respuesta = await fetch(`${API_BASE_URL}/plataforma/copias/${archivo}`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => ({}));
    throw new Error(datos.mensaje || 'No se pudo descargar la copia.');
  }
  const blob = await respuesta.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo || archivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
