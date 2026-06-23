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
