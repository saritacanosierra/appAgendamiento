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
      correo: datos.correo || null,
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
