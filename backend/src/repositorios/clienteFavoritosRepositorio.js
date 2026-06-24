import { pool } from '../configuracion/baseDatos.js';

export class ClienteFavoritosRepositorio {
  async listarPorCliente(marcaId, clienteId) {
    const [filas] = await pool.execute(
      `SELECT f.id, f.tipo, f.referencia_id, f.created_at,
              CASE
                WHEN f.tipo = 'servicio' THEN s.nombre
                WHEN f.tipo = 'diseno_galeria' THEN d.titulo
              END AS titulo,
              CASE
                WHEN f.tipo = 'servicio' THEN s.imagen_ruta
                WHEN f.tipo = 'diseno_galeria' THEN d.imagen_ruta
              END AS imagen_ruta,
              CASE
                WHEN f.tipo = 'servicio' THEN s.precio
                ELSE NULL
              END AS precio,
              CASE
                WHEN f.tipo = 'servicio' THEN s.activo
                WHEN f.tipo = 'diseno_galeria' THEN d.activo
              END AS referencia_activa
       FROM cliente_favoritos f
       LEFT JOIN servicios s
         ON f.tipo = 'servicio' AND s.id = f.referencia_id AND s.marca_id = f.marca_id
       LEFT JOIN disenos_galeria d
         ON f.tipo = 'diseno_galeria' AND d.id = f.referencia_id AND d.marca_id = f.marca_id
       WHERE f.marca_id = ? AND f.cliente_id = ?
       ORDER BY f.created_at DESC`,
      [marcaId, clienteId]
    );
    return filas;
  }

  async contarPorCliente(marcaId, clienteId) {
    const [filas] = await pool.execute(
      `SELECT COUNT(*) AS total FROM cliente_favoritos WHERE marca_id = ? AND cliente_id = ?`,
      [marcaId, clienteId]
    );
    return Number(filas[0]?.total ?? 0);
  }

  async existe(marcaId, clienteId, tipo, referenciaId) {
    const [filas] = await pool.execute(
      `SELECT id FROM cliente_favoritos
       WHERE marca_id = ? AND cliente_id = ? AND tipo = ? AND referencia_id = ?
       LIMIT 1`,
      [marcaId, clienteId, tipo, referenciaId]
    );
    return filas[0] ?? null;
  }

  async agregar({ marcaId, clienteId, tipo, referenciaId }) {
    const [resultado] = await pool.execute(
      `INSERT INTO cliente_favoritos (marca_id, cliente_id, tipo, referencia_id)
       VALUES (?, ?, ?, ?)`,
      [marcaId, clienteId, tipo, referenciaId]
    );
    return resultado.insertId;
  }

  async quitar(marcaId, clienteId, tipo, referenciaId) {
    const [resultado] = await pool.execute(
      `DELETE FROM cliente_favoritos
       WHERE marca_id = ? AND cliente_id = ? AND tipo = ? AND referencia_id = ?`,
      [marcaId, clienteId, tipo, referenciaId]
    );
    return resultado.affectedRows > 0;
  }

  async calcularPuntosCliente(marcaId, clienteId) {
    const [filas] = await pool.execute(
      `SELECT COALESCE(SUM(FLOOR(COALESCE(c.precio_final, s.precio) * 10)), 0) AS puntos
       FROM citas c
       INNER JOIN servicios s ON s.id = c.servicio_id
       WHERE c.marca_id = ? AND c.cliente_id = ? AND c.estado = 'completada'`,
      [marcaId, clienteId]
    );
    return Number(filas[0]?.puntos ?? 0);
  }

  async contarServiciosCompletados(marcaId, clienteId) {
    const [filas] = await pool.execute(
      `SELECT COUNT(*) AS total FROM citas
       WHERE marca_id = ? AND cliente_id = ? AND estado = 'completada'`,
      [marcaId, clienteId]
    );
    return Number(filas[0]?.total ?? 0);
  }
}
