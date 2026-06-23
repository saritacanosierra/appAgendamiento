import { pool } from '../configuracion/baseDatos.js';
import {
  ReservaRepositorio,
  SolicitudReagendamientoRepositorio,
} from '../repositorios/index.js';
import { normalizarHora, sumarMinutosAHora } from '../utilidades/horarios.js';

function formatearFecha(valor) {
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  return String(valor).slice(0, 10);
}

function formatearHora(valor) {
  return normalizarHora(String(valor).slice(0, 5));
}

export function mapearSolicitudReagendamiento(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    citaId: fila.cita_id,
    codigoConfirmacion: fila.codigo_confirmacion,
    estado: fila.estado,
    citaEstado: fila.cita_estado,
    fechaActual: formatearFecha(fila.fecha_actual),
    horaActual: formatearHora(fila.hora_actual),
    fechaSolicitada: formatearFecha(fila.fecha_solicitada),
    horaInicioSolicitada: formatearHora(fila.hora_inicio_solicitada),
    horaFinSolicitada: formatearHora(fila.hora_fin_solicitada),
    motivo: fila.motivo,
    cliente: {
      nombre: fila.cliente_nombre,
      telefono: fila.cliente_telefono,
    },
    servicio: {
      nombre: fila.servicio_nombre,
      duracionMinutos: fila.duracion_minutos,
    },
    createdAt: fila.created_at,
  };
}

export class SolicitudReagendamientoServicio {
  constructor(deps = {}) {
    this.solicitudRepo = deps.solicitudRepo ?? new SolicitudReagendamientoRepositorio();
    this.reservaRepo = deps.reservaRepo ?? new ReservaRepositorio();
  }

  async listarPendientes(marcaId) {
    const filas = await this.solicitudRepo.listarPorMarca(marcaId, { estado: 'pendiente' });
    return filas.map(mapearSolicitudReagendamiento);
  }

  async aprobar(marcaId, solicitudId) {
    const solicitud = await this.solicitudRepo.buscarPorId(marcaId, solicitudId);
    if (!solicitud) return { error: 'Solicitud no encontrada.', codigoHttp: 404 };
    if (solicitud.estado !== 'pendiente') {
      return { error: 'Esta solicitud ya fue procesada.', codigoHttp: 409 };
    }
    if (!['pendiente', 'confirmada'].includes(solicitud.cita_estado)) {
      return { error: 'La cita ya no esta activa.', codigoHttp: 409 };
    }

    const fecha = formatearFecha(solicitud.fecha_solicitada);
    const horaInicio = formatearHora(solicitud.hora_inicio_solicitada);
    const horaFin = formatearHora(solicitud.hora_fin_solicitada);

    const conexion = await pool.getConnection();

    try {
      await conexion.beginTransaction();

      const solapa = await this.reservaRepo.existeSolapamiento(
        conexion,
        marcaId,
        fecha,
        horaInicio,
        horaFin,
        solicitud.cita_id
      );

      if (solapa) {
        await conexion.rollback();
        return { error: 'El horario solicitado ya no esta disponible.', codigoHttp: 409 };
      }

      await this.reservaRepo.actualizar(conexion, marcaId, solicitud.cita_id, {
        fecha,
        horaInicio,
        horaFin,
        estado: 'confirmada',
      });

      await this.solicitudRepo.actualizarEstado(conexion, marcaId, solicitudId, 'aprobada');
      await this.solicitudRepo.rechazarPendientesDeCita(conexion, marcaId, solicitud.cita_id, solicitudId);

      await conexion.commit();

      try {
        const { notificacionServicio } = await import('./notificacionServicio.js');
        await notificacionServicio.registrarReagendamientoAprobado({
          marcaId,
          citaId: solicitud.cita_id,
          clienteNombre: solicitud.cliente_nombre,
          servicioNombre: solicitud.servicio_nombre,
          fecha,
          horaInicio,
        });
      } catch {
        // Notificacion opcional
      }

      try {
        const { googleCalendarServicio } = await import('./googleCalendarServicio.js');
        await googleCalendarServicio.sincronizarCita(marcaId, {
          fecha,
          horaInicio,
          horaFin,
          titulo: `${solicitud.servicio_nombre} — ${solicitud.cliente_nombre}`,
          descripcion: `Reagendamiento aprobado · ${solicitud.codigo_confirmacion}`,
          clienteNombre: solicitud.cliente_nombre,
        });
      } catch {
        // Sync opcional
      }

      const actualizada = await this.solicitudRepo.buscarPorId(marcaId, solicitudId);
      return { solicitud: mapearSolicitudReagendamiento(actualizada) };
    } catch (err) {
      await conexion.rollback();
      throw err;
    } finally {
      conexion.release();
    }
  }

  async rechazar(marcaId, solicitudId) {
    const solicitud = await this.solicitudRepo.buscarPorId(marcaId, solicitudId);
    if (!solicitud) return { error: 'Solicitud no encontrada.', codigoHttp: 404 };
    if (solicitud.estado !== 'pendiente') {
      return { error: 'Esta solicitud ya fue procesada.', codigoHttp: 409 };
    }

    await this.solicitudRepo.actualizarEstado(null, marcaId, solicitudId, 'rechazada');
    const actualizada = await this.solicitudRepo.buscarPorId(marcaId, solicitudId);
    return { solicitud: mapearSolicitudReagendamiento(actualizada) };
  }
}

export const solicitudReagendamientoServicio = new SolicitudReagendamientoServicio();
