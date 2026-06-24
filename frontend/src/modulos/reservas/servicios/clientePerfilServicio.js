import { peticionPublica } from '../../../compartido/utilidades/apiCliente';

function credencialesBody(marcaId, { telefono, correo }) {
  return {
    marca_id: marcaId,
    telefono,
    correo: correo?.trim().toLowerCase() || null,
  };
}

export async function agregarFavorito(marcaId, credenciales, tipo, referenciaId) {
  const respuesta = await peticionPublica('/reservas/favoritos', {
    method: 'POST',
    body: JSON.stringify({
      ...credencialesBody(marcaId, credenciales),
      tipo,
      referencia_id: referenciaId,
    }),
  });
  return respuesta.datos;
}

export async function quitarFavorito(marcaId, credenciales, tipo, referenciaId) {
  const respuesta = await peticionPublica('/reservas/favoritos', {
    method: 'DELETE',
    body: JSON.stringify({
      ...credencialesBody(marcaId, credenciales),
      tipo,
      referencia_id: referenciaId,
    }),
  });
  return respuesta.datos;
}
