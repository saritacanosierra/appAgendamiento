import { pool } from '../configuracion/baseDatos.js';

export class SolicitudReagendamientoRepositorio {
  async crear(conexion, datos) {
    const db = conexion ?? pool;
    const [resultado] = await db.execute(
      `INSERT INTO solicitudes_reagendamiento (
         marca_id, cita_id, fecha_actual, hora_actual,
         fecha_solicitada, hora_inicio_solicitada, hora_fin_solicitada, motivo, estado
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
      [
        datos.marcaId,
        datos.citaId,
        datos.fechaActual,
        datos.horaActual,
        datos.fechaSolicitada,
        datos.horaInicioSolicitada,
        datos.horaFinSolicitada,
        datos.motivo ?? null,
      ]
    );
    return resultado.insertId;
  }

  async buscarPorId(marcaId, id) {
    const [filas] = await pool.execute(
      `SELECT sr.*,
              c.codigo_confirmacion, c.estado AS cita_estado,
              cl.nombre AS cliente_nombre, cl.telefono AS cliente_telefono,
              s.nombre AS servicio_nombre, s.duracion_minutos
       FROM solicitudes_reagendamiento sr
       INNER JOIN citas c ON c.id = sr.cita_id
       INNER JOIN clientes cl ON cl.id = c.cliente_id
       INNER JOIN servicios s ON s.id = c.servicio_id
       WHERE sr.id = ? AND sr.marca_id = ?
       LIMIT 1`,
      [id, marcaId]
    );
    return filas[0] ?? null;
  }

  async buscarPendientePorCita(citaId) {
    const [filas] = await pool.execute(
      `SELECT * FROM solicitudes_reagendamiento
       WHERE cita_id = ? AND estado = 'pendiente'
       ORDER BY created_at DESC
       LIMIT 1`,
      [citaId]
    );
    return filas[0] ?? null;
  }

  async listarPorMarca(marcaId, { estado = 'pendiente' } = {}) {
    let sql = `
      SELECT sr.*,
             c.codigo_confirmacion, c.estado AS cita_estado,
             cl.nombre AS cliente_nombre, cl.telefono AS cliente_telefono,
             s.nombre AS servicio_nombre, s.duracion_minutos
      FROM solicitudes_reagendamiento sr
      INNER JOIN citas c ON c.id = sr.cita_id
      INNER JOIN clientes cl ON cl.id = c.cliente_id
      INNER JOIN servicios s ON s.id = c.servicio_id
      WHERE sr.marca_id = ?`;
    const params = [marcaId];

    if (estado) {
      sql += ' AND sr.estado = ?';
      params.push(estado);
    }

    if (estado === 'pendiente') {
      sql += " AND c.estado IN ('pendiente', 'confirmada')";
    }

    sql += ' ORDER BY sr.created_at DESC';
    const [filas] = await pool.execute(sql, params);
    return filas;
  }

  async actualizarEstado(conexion, marcaId, id, estado) {
    const db = conexion ?? pool;
    const [resultado] = await db.execute(
      `UPDATE solicitudes_reagendamiento SET estado = ?
       WHERE id = ? AND marca_id = ?`,
      [estado, id, marcaId]
    );
    return resultado.affectedRows > 0;
  }

  async rechazarPendientesDeCita(conexion, marcaId, citaId, exceptoId = null) {
    const db = conexion ?? pool;
    let sql = `UPDATE solicitudes_reagendamiento SET estado = 'rechazada'
               WHERE marca_id = ? AND cita_id = ? AND estado = 'pendiente'`;
    const params = [marcaId, citaId];

    if (exceptoId) {
      sql += ' AND id != ?';
      params.push(exceptoId);
    }

    await db.execute(sql, params);
  }
}
