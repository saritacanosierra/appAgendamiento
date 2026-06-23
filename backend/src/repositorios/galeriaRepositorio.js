import { pool } from '../configuracion/baseDatos.js';

export class GaleriaRepositorio {
  async listarActivos(marcaId) {
    const [filas] = await pool.execute(
      `SELECT id, marca_id, titulo, imagen_ruta, categoria, colores_relacionados,
              activo, orden_visualizacion, created_at
       FROM disenos_galeria
       WHERE marca_id = ? AND activo = 1
       ORDER BY orden_visualizacion ASC, created_at DESC`,
      [marcaId]
    );
    return filas;
  }

  async listarPorMarca(marcaId) {
    const [filas] = await pool.execute(
      `SELECT * FROM disenos_galeria
       WHERE marca_id = ?
       ORDER BY orden_visualizacion ASC, created_at DESC`,
      [marcaId]
    );
    return filas;
  }

  async buscarPorId(marcaId, id) {
    const [filas] = await pool.execute(
      `SELECT * FROM disenos_galeria WHERE id = ? AND marca_id = ? LIMIT 1`,
      [id, marcaId]
    );
    return filas[0] ?? null;
  }

  async crear(datos) {
    const [resultado] = await pool.execute(
      `INSERT INTO disenos_galeria
       (marca_id, titulo, imagen_ruta, categoria, colores_relacionados, activo, orden_visualizacion)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.marcaId,
        datos.titulo,
        datos.imagenRuta,
        datos.categoria ?? null,
        datos.coloresRelacionados ?? null,
        datos.activo ? 1 : 0,
        datos.ordenVisualizacion ?? 0,
      ]
    );
    return resultado.insertId;
  }

  async actualizar(marcaId, id, datos) {
    await pool.execute(
      `UPDATE disenos_galeria
       SET titulo = ?, imagen_ruta = ?, categoria = ?, colores_relacionados = ?,
           activo = ?, orden_visualizacion = ?
       WHERE id = ? AND marca_id = ?`,
      [
        datos.titulo,
        datos.imagenRuta,
        datos.categoria ?? null,
        datos.coloresRelacionados ?? null,
        datos.activo ? 1 : 0,
        datos.ordenVisualizacion ?? 0,
        id,
        marcaId,
      ]
    );
  }
}
