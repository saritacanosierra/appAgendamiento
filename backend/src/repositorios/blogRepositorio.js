import { pool } from '../configuracion/baseDatos.js';

export class BlogRepositorio {
  async listarPublicados(marcaId) {
    const [filas] = await pool.execute(
      `SELECT id, marca_id, titulo, slug, imagen_destacada, extracto, categoria,
              estado, fecha_publicacion, created_at
       FROM publicaciones_blog
       WHERE marca_id = ? AND estado = 'publicado'
       ORDER BY fecha_publicacion DESC, created_at DESC`,
      [marcaId]
    );
    return filas;
  }

  async buscarPublicadoPorSlug(marcaId, slug) {
    const [filas] = await pool.execute(
      `SELECT * FROM publicaciones_blog
       WHERE marca_id = ? AND slug = ? AND estado = 'publicado'
       LIMIT 1`,
      [marcaId, slug]
    );
    return filas[0] ?? null;
  }

  async listarPorMarca(marcaId) {
    const [filas] = await pool.execute(
      `SELECT * FROM publicaciones_blog
       WHERE marca_id = ?
       ORDER BY updated_at DESC`,
      [marcaId]
    );
    return filas;
  }

  async buscarPorId(marcaId, id) {
    const [filas] = await pool.execute(
      `SELECT * FROM publicaciones_blog WHERE id = ? AND marca_id = ? LIMIT 1`,
      [id, marcaId]
    );
    return filas[0] ?? null;
  }

  async existeSlug(marcaId, slug, excluirId = null) {
    const params = [marcaId, slug];
    let sql = `SELECT id FROM publicaciones_blog WHERE marca_id = ? AND slug = ?`;
    if (excluirId) {
      sql += ' AND id != ?';
      params.push(excluirId);
    }
    sql += ' LIMIT 1';
    const [filas] = await pool.execute(sql, params);
    return Boolean(filas[0]);
  }

  async crear(datos) {
    const [resultado] = await pool.execute(
      `INSERT INTO publicaciones_blog
       (marca_id, titulo, slug, imagen_destacada, extracto, contenido, categoria, estado, fecha_publicacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.marcaId,
        datos.titulo,
        datos.slug,
        datos.imagenDestacada ?? null,
        datos.extracto ?? null,
        datos.contenido,
        datos.categoria ?? null,
        datos.estado,
        datos.fechaPublicacion ?? null,
      ]
    );
    return resultado.insertId;
  }

  async actualizar(marcaId, id, datos) {
    await pool.execute(
      `UPDATE publicaciones_blog
       SET titulo = ?, slug = ?, imagen_destacada = ?, extracto = ?, contenido = ?,
           categoria = ?, estado = ?, fecha_publicacion = ?
       WHERE id = ? AND marca_id = ?`,
      [
        datos.titulo,
        datos.slug,
        datos.imagenDestacada ?? null,
        datos.extracto ?? null,
        datos.contenido,
        datos.categoria ?? null,
        datos.estado,
        datos.fechaPublicacion ?? null,
        id,
        marcaId,
      ]
    );
  }
}
