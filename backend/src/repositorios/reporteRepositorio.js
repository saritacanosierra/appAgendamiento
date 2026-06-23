import { pool } from '../configuracion/baseDatos.js';

export class ReporteRepositorio {
  async resumenCitasPorEstado(marcaId, desde, hasta) {
    const [filas] = await pool.execute(
      `SELECT c.estado, COUNT(*) AS total,
              COALESCE(SUM(s.precio), 0) AS ingreso
       FROM citas c
       INNER JOIN servicios s ON s.id = c.servicio_id
       WHERE c.marca_id = ? AND c.fecha BETWEEN ? AND ?
       GROUP BY c.estado`,
      [marcaId, desde, hasta]
    );
    return filas;
  }

  async contarClientesNuevas(marcaId, desde, hasta) {
    const [filas] = await pool.execute(
      `SELECT COUNT(*) AS total FROM clientes
       WHERE marca_id = ? AND activo = 1
         AND DATE(created_at) BETWEEN ? AND ?`,
      [marcaId, desde, hasta]
    );
    return Number(filas[0]?.total ?? 0);
  }

  async citasPorDia(marcaId, desde, hasta) {
    const [filas] = await pool.execute(
      `SELECT c.fecha, COUNT(*) AS total,
              COALESCE(SUM(CASE WHEN c.estado != 'cancelada' THEN s.precio ELSE 0 END), 0) AS ingreso
       FROM citas c
       INNER JOIN servicios s ON s.id = c.servicio_id
       WHERE c.marca_id = ? AND c.fecha BETWEEN ? AND ?
       GROUP BY c.fecha
       ORDER BY c.fecha ASC`,
      [marcaId, desde, hasta]
    );
    return filas;
  }

  async serviciosPopulares(marcaId, desde, hasta, limite = 5) {
    const [filas] = await pool.execute(
      `SELECT s.nombre, COUNT(*) AS citas,
              COALESCE(SUM(s.precio), 0) AS ingreso
       FROM citas c
       INNER JOIN servicios s ON s.id = c.servicio_id
       WHERE c.marca_id = ? AND c.fecha BETWEEN ? AND ? AND c.estado != 'cancelada'
       GROUP BY s.id, s.nombre
       ORDER BY citas DESC
       LIMIT ?`,
      [marcaId, desde, hasta, limite]
    );
    return filas;
  }
}
