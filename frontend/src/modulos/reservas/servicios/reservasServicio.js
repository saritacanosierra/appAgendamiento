import { peticionPublica } from '../../../compartido/utilidades/apiCliente';

export async function obtenerDisponibilidad(marcaId, servicioId, fecha, estilistaId) {
  const params = new URLSearchParams({ servicio_id: servicioId, fecha });
  if (estilistaId) params.set('estilista_id', String(estilistaId));
  const respuesta = await peticionPublica(
    `/marcas/${marcaId}/disponibilidad?${params}`
  );
  return respuesta.datos;
}

export async function crearReserva(datos) {
  const respuesta = await peticionPublica('/reservas', {
    method: 'POST',
    body: JSON.stringify({
      marca_id: datos.marcaId,
      servicio_id: datos.servicioId,
      estilista_id: datos.estilistaId ?? null,
      fecha: datos.fecha,
      hora_inicio: datos.horaInicio,
      nombre: datos.nombre,
      telefono: datos.telefono,
    }),
  });
  return respuesta.datos;
}

export async function obtenerConfirmacion(codigo, slug) {
  const params = new URLSearchParams({ slug });
  const respuesta = await peticionPublica(
    `/reservas/confirmacion/${encodeURIComponent(codigo)}?${params}`
  );
  return respuesta.datos;
}

export async function actualizarCelular(marcaId, telefonoActual, telefonoNuevo) {
  const respuesta = await peticionPublica('/reservas/actualizar-celular', {
    method: 'POST',
    body: JSON.stringify({
      marca_id: marcaId,
      telefono_actual: telefonoActual,
      telefono_nuevo: telefonoNuevo,
    }),
  });
  return respuesta.datos;
}

export async function consultarCitas(marcaId, { telefono, correo }) {
  const respuesta = await peticionPublica('/reservas/consultar', {
    method: 'POST',
    body: JSON.stringify({
      marca_id: marcaId,
      telefono,
      correo: correo?.trim().toLowerCase() || null,
    }),
  });
  return respuesta.datos;
}

export async function cancelarCitaPublica(marcaId, codigo, telefono) {
  const respuesta = await peticionPublica(
    `/reservas/${encodeURIComponent(codigo)}/cancelar`,
    {
      method: 'POST',
      body: JSON.stringify({ marca_id: marcaId, telefono }),
    }
  );
  return respuesta.datos;
}

export async function solicitarReagendamiento(marcaId, codigo, telefono, fecha, horaInicio) {
  const respuesta = await peticionPublica(
    `/reservas/${encodeURIComponent(codigo)}/reagendar`,
    {
      method: 'POST',
      body: JSON.stringify({
        marca_id: marcaId,
        telefono,
        fecha,
        hora_inicio: horaInicio,
      }),
    }
  );
  return respuesta.datos;
}
