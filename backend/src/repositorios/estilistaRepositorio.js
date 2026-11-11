import { pool } from '../configuracion/baseDatos.js';

export class EstilistaRepositorio {
  async listarActivos(marcaId) {
    const [filas] = await pool.execute(
      `SELECT id, marca_id, nombre, foto_ruta, habilidades, descripcion, activo, orden_visualizacion
       FROM estilistas
       WHERE marca_id = ? AND activo = 1
       ORDER BY orden_visualizacion ASC, nombre ASC`,
      [marcaId]
    );
    return filas;
  }

  async listarPorMarca(marcaId) {
    const [filas] = await pool.execute(
      `SELECT id, marca_id, nombre, foto_ruta, habilidades, descripcion, activo, orden_visualizacion, created_at, updated_at
       FROM estilistas
       WHERE marca_id = ?
       ORDER BY orden_visualizacion ASC, nombre ASC`,
      [marcaId]
    );
    return filas;
  }

  async buscarPorId(marcaId, id) {
    const [filas] = await pool.execute(
      `SELECT id, marca_id, nombre, foto_ruta, habilidades, descripcion, activo, orden_visualizacion
       FROM estilistas
       WHERE id = ? AND marca_id = ?
       LIMIT 1`,
      [id, marcaId]
    );
    return filas[0] ?? null;
  }

  async crear({ marcaId, nombre, fotoRuta = null, habilidades = null, descripcion = null, ordenVisualizacion = 0 }) {
    const [resultado] = await pool.execute(
      `INSERT INTO estilistas (marca_id, nombre, foto_ruta, habilidades, descripcion, activo, orden_visualizacion)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [marcaId, nombre, fotoRuta, habilidades, descripcion, ordenVisualizacion]
    );
    return resultado.insertId;
  }

  async actualizar(marcaId, id, { nombre, fotoRuta, habilidades, descripcion, activo, ordenVisualizacion }) {
    const [resultado] = await pool.execute(
      `UPDATE estilistas
       SET nombre = ?, foto_ruta = ?, habilidades = ?, descripcion = ?, activo = ?, orden_visualizacion = ?
       WHERE id = ? AND marca_id = ?`,
      [nombre, fotoRuta, habilidades, descripcion, activo ? 1 : 0, ordenVisualizacion, id, marcaId]
    );
    return resultado.affectedRows > 0;
  }
}
