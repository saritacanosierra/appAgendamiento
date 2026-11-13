import { pool } from '../configuracion/baseDatos.js';

export class GaleriaRepositorio {
  async listarActivos(marcaId, limite = null) {
    const tope = Number(limite);
    const conTope = Number.isInteger(tope) && tope > 0 && tope <= 24;
    const [filas] = await pool.execute(
      `SELECT id, marca_id, estilista_id, titulo, imagen_ruta, categoria, temporada, colores_relacionados,
              activo, orden_visualizacion, en_tendencia, created_at
       FROM disenos_galeria
       WHERE marca_id = ? AND activo = 1
       ORDER BY orden_visualizacion ASC, created_at DESC${conTope ? ` LIMIT ${tope}` : ''}`,
      [marcaId]
    );
    return filas;
  }

  async listarActivosConEstilista(marcaId) {
    const [filas] = await pool.execute(
      `SELECT id, estilista_id, titulo, imagen_ruta
       FROM disenos_galeria
       WHERE marca_id = ? AND activo = 1 AND estilista_id IS NOT NULL
       ORDER BY orden_visualizacion ASC, id DESC`,
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
       (marca_id, estilista_id, titulo, imagen_ruta, categoria, temporada, colores_relacionados, activo, orden_visualizacion, en_tendencia)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.marcaId,
        datos.estilistaId ?? null,
        datos.titulo,
        datos.imagenRuta,
        datos.categoria ?? null,
        datos.temporada ?? null,
        datos.coloresRelacionados ?? null,
        datos.activo ? 1 : 0,
        datos.ordenVisualizacion ?? 0,
        datos.enTendencia ? 1 : 0,
      ]
    );
    return resultado.insertId;
  }

  async eliminar(marcaId, id) {
    await pool.execute(
      `DELETE FROM disenos_galeria WHERE id = ? AND marca_id = ?`,
      [id, marcaId]
    );
  }

  async actualizar(marcaId, id, datos) {
    await pool.execute(
      `UPDATE disenos_galeria
       SET titulo = ?, imagen_ruta = ?, categoria = ?, temporada = ?, colores_relacionados = ?,
           activo = ?, orden_visualizacion = ?, en_tendencia = ?, estilista_id = ?
       WHERE id = ? AND marca_id = ?`,
      [
        datos.titulo,
        datos.imagenRuta,
        datos.categoria ?? null,
        datos.temporada ?? null,
        datos.coloresRelacionados ?? null,
        datos.activo ? 1 : 0,
        datos.ordenVisualizacion ?? 0,
        datos.enTendencia ? 1 : 0,
        datos.estilistaId ?? null,
        id,
        marcaId,
      ]
    );
  }
}
