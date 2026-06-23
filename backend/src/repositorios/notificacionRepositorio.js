import { pool } from '../configuracion/baseDatos.js';

export class NotificacionRepositorio {
  async listarPorMarca(marcaId, { soloNoLeidas = false, limite = 50 } = {}) {
    let sql = `SELECT * FROM notificaciones WHERE marca_id = ?`;
    const params = [marcaId];

    if (soloNoLeidas) {
      sql += ' AND leida = 0';
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limite);

    const [filas] = await pool.execute(sql, params);
    return filas;
  }

  async contarNoLeidas(marcaId) {
    const [filas] = await pool.execute(
      `SELECT COUNT(*) AS total FROM notificaciones WHERE marca_id = ? AND leida = 0`,
      [marcaId]
    );
    return filas[0]?.total ?? 0;
  }

  async crear(datos) {
    const [resultado] = await pool.execute(
      `INSERT INTO notificaciones
       (marca_id, tipo, titulo, mensaje, referencia_tipo, referencia_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        datos.marcaId,
        datos.tipo,
        datos.titulo,
        datos.mensaje,
        datos.referenciaTipo ?? null,
        datos.referenciaId ?? null,
      ]
    );
    return resultado.insertId;
  }

  async marcarLeida(marcaId, id) {
    const [resultado] = await pool.execute(
      `UPDATE notificaciones SET leida = 1 WHERE id = ? AND marca_id = ?`,
      [id, marcaId]
    );
    return resultado.affectedRows > 0;
  }

  async marcarTodasLeidas(marcaId) {
    await pool.execute(
      `UPDATE notificaciones SET leida = 1 WHERE marca_id = ? AND leida = 0`,
      [marcaId]
    );
  }

  async buscarPorId(marcaId, id) {
    const [filas] = await pool.execute(
      `SELECT * FROM notificaciones WHERE id = ? AND marca_id = ? LIMIT 1`,
      [id, marcaId]
    );
    return filas[0] ?? null;
  }
}
