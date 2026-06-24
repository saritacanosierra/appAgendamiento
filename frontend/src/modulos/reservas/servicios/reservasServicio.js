import { peticionPublica } from '../../../compartido/utilidades/apiCliente';

export async function obtenerDisponibilidad(marcaId, servicioId, fecha) {
  const params = new URLSearchParams({ servicio_id: servicioId, fecha });
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
      fecha: datos.fecha,
      hora_inicio: datos.horaInicio,
      nombre: datos.nombre,
      telefono: datos.telefono,
      correo: datos.correo.trim().toLowerCase(),
    }),
  });
  return respuesta.datos;
}

export async function obtenerConfirmacion(codigo) {
  const respuesta = await peticionPublica(
    `/reservas/confirmacion/${encodeURIComponent(codigo)}`
  );
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
