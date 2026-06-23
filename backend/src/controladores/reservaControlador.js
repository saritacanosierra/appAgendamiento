import { ReservaServicio } from '../servicios/reservaServicio.js';
import { respuestaExito, respuestaError } from '../utilidades/respuestaJson.js';
import { entero, texto } from '../utilidades/sanitizador.js';
import { registrarAuditoria } from '../utilidades/auditoria.js';

const reservaServicio = new ReservaServicio();

export async function obtenerDisponibilidad(req, res) {
  const marcaId = entero(req.params.marca_id);
  const servicioId = entero(req.query.servicio_id);
  const fecha = texto(req.query.fecha);

  if (!marcaId || !servicioId || !fecha) {
    return respuestaError(res, 'marca_id, servicio_id y fecha son obligatorios.', 422);
  }

  const resultado = await reservaServicio.obtenerDisponibilidad(marcaId, servicioId, fecha);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }

  return respuestaExito(res, resultado, 'Horarios disponibles');
}

export async function crearReserva(req, res) {
  const resultado = await reservaServicio.crearReservaPublica(req.body);

  if (resultado.error) {
    return respuestaError(
      res,
      resultado.error,
      resultado.codigoHttp ?? 400,
      resultado.errores
    );
  }

  registrarAuditoria('reserva_publica_creada', {
    ip: req.ip,
    marcaId: req.body?.marca_id ?? req.body?.marcaId,
    codigo: resultado.confirmacion?.cita?.codigoConfirmacion,
  });

  return respuestaExito(res, resultado.confirmacion, 'Reserva creada', 201);
}

export async function obtenerConfirmacion(req, res) {
  const codigo = texto(req.params.codigo)?.toUpperCase();
  if (!codigo) {
    return respuestaError(res, 'Codigo invalido.', 422);
  }

  const confirmacion = await reservaServicio.obtenerPorCodigo(codigo);
  if (!confirmacion) {
    return respuestaError(res, 'Reserva no encontrada.', 404);
  }

  return respuestaExito(res, confirmacion, 'Confirmacion de reserva');
}

export async function consultarCitas(req, res) {
  const marcaId = entero(req.body?.marca_id ?? req.body?.marcaId);
  const correo = texto(req.body?.correo) || null;
  const telefono = texto(req.body?.telefono);

  const resultado = await reservaServicio.consultarCitas(marcaId, { correo, telefono });

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }

  return respuestaExito(res, resultado, 'Consulta de citas');
}

export async function cancelarReservaPublica(req, res) {
  const marcaId = entero(req.body?.marca_id ?? req.body?.marcaId);
  const codigo = texto(req.params.codigo)?.toUpperCase();
  const telefono = texto(req.body?.telefono);

  const resultado = await reservaServicio.cancelarReservaPublica(marcaId, codigo, telefono);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }

  registrarAuditoria('reserva_publica_cancelada', { ip: req.ip, marcaId, codigo });

  return respuestaExito(res, resultado.cita, 'Cita cancelada');
}

export async function solicitarReagendamiento(req, res) {
  const marcaId = entero(req.body?.marca_id ?? req.body?.marcaId);
  const codigo = texto(req.params.codigo)?.toUpperCase();
  const telefono = texto(req.body?.telefono);
  const fecha = texto(req.body?.fecha);
  const horaInicio = texto(req.body?.hora_inicio ?? req.body?.horaInicio);

  const resultado = await reservaServicio.solicitarReagendamiento(
    marcaId,
    codigo,
    telefono,
    fecha,
    horaInicio
  );

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }

  registrarAuditoria('reserva_solicitud_reagendamiento', { ip: req.ip, marcaId, codigo });

  return respuestaExito(res, resultado, 'Solicitud de reagendamiento enviada', 201);
}
