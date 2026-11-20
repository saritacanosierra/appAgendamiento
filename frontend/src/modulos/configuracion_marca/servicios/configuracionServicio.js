import { peticionAdmin } from '../../../compartido/utilidades/apiCliente';

export async function obtenerPuestaEnMarcha() {
  const respuesta = await peticionAdmin('/admin/puesta-en-marcha');
  return respuesta.datos;
}

export async function obtenerConfiguracionMarca() {
  const respuesta = await peticionAdmin('/admin/configuracion-marca');
  return respuesta.datos;
}

export async function actualizarConfiguracionMarca(datos) {
  const respuesta = await peticionAdmin('/admin/configuracion-marca', {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function obtenerPoliticaPrivacidad() {
  const respuesta = await peticionAdmin('/admin/politica-privacidad');
  return respuesta.datos;
}

export async function aceptarPoliticaPrivacidad() {
  const respuesta = await peticionAdmin('/admin/politica-privacidad', {
    method: 'POST',
    body: JSON.stringify({ deAcuerdo: true }),
  });
  return respuesta.datos;
}
