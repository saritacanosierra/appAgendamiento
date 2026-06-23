import { pool } from '../configuracion/baseDatos.js';

export class CarruselRepositorio {
  async listarActivos(marcaId) {
    const [filas] = await pool.execute(
      `SELECT id, marca_id, titulo, subtitulo, imagen_ruta, enlace_url,
              activo, orden_visualizacion, created_at, updated_at
       FROM carrusel_inicio
       WHERE marca_id = ? AND activo = 1
       ORDER BY orden_visualizacion ASC, created_at ASC`,
      [marcaId]
    );
    return filas;
  }

  async listarPorMarca(marcaId) {
    const [filas] = await pool.execute(
      `SELECT * FROM carrusel_inicio
       WHERE marca_id = ?
       ORDER BY orden_visualizacion ASC, created_at ASC`,
      [marcaId]
    );
    return filas;
  }

  async buscarPorId(marcaId, id) {
    const [filas] = await pool.execute(
      `SELECT * FROM carrusel_inicio WHERE id = ? AND marca_id = ? LIMIT 1`,
      [id, marcaId]
    );
    return filas[0] ?? null;
  }

  async crear(datos) {
    const [resultado] = await pool.execute(
      `INSERT INTO carrusel_inicio
       (marca_id, titulo, subtitulo, imagen_ruta, enlace_url, activo, orden_visualizacion)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.marcaId,
        datos.titulo,
        datos.subtitulo ?? null,
        datos.imagenRuta,
        datos.enlaceUrl ?? null,
        datos.activo ? 1 : 0,
        datos.ordenVisualizacion ?? 0,
      ]
    );
    return resultado.insertId;
  }

  async actualizar(marcaId, id, datos) {
    await pool.execute(
      `UPDATE carrusel_inicio
       SET titulo = ?, subtitulo = ?, imagen_ruta = ?, enlace_url = ?,
           activo = ?, orden_visualizacion = ?
       WHERE id = ? AND marca_id = ?`,
      [
        datos.titulo,
        datos.subtitulo ?? null,
        datos.imagenRuta,
        datos.enlaceUrl ?? null,
        datos.activo ? 1 : 0,
        datos.ordenVisualizacion ?? 0,
        id,
        marcaId,
      ]
    );
  }
}
