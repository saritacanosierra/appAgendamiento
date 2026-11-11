import { pool } from '../configuracion/baseDatos.js';

const COLUMNAS = `id, anunciante, titulo, tipo, texto, imagen_ruta, enlace_url, activa, orden_visualizacion`;

function idsPlaceholders(ids) {
  return ids.map(() => '?').join(', ');
}

export class PublicidadRepositorio {
  async listarActivasPorPublicacion(publicacionId) {
    const [filas] = await pool.execute(
      `SELECT p.${COLUMNAS.split(', ').join(', p.')}
       FROM publicidad_blog p
       INNER JOIN publicidad_blog_publicacion pp ON pp.publicidad_id = p.id
       WHERE p.activa = 1 AND pp.publicacion_id = ?
       ORDER BY p.orden_visualizacion ASC, p.id DESC`,
      [publicacionId]
    );
    return filas;
  }

  async listarTodas() {
    const [filas] = await pool.execute(
      `SELECT ${COLUMNAS},
              (SELECT GROUP_CONCAT(publicacion_id ORDER BY publicacion_id)
               FROM publicidad_blog_publicacion
               WHERE publicidad_id = publicidad_blog.id) AS publicacion_ids
       FROM publicidad_blog
       ORDER BY orden_visualizacion ASC, id DESC`
    );
    return filas;
  }

  async buscarPorId(id) {
    const [filas] = await pool.execute(
      `SELECT ${COLUMNAS},
              (SELECT GROUP_CONCAT(publicacion_id ORDER BY publicacion_id)
               FROM publicidad_blog_publicacion
               WHERE publicidad_id = publicidad_blog.id) AS publicacion_ids
       FROM publicidad_blog WHERE id = ? LIMIT 1`,
      [id]
    );
    return filas[0] ?? null;
  }

  async crear(datos) {
    const [resultado] = await pool.execute(
      `INSERT INTO publicidad_blog
        (anunciante, titulo, tipo, texto, imagen_ruta, enlace_url, activa, orden_visualizacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.anunciante,
        datos.titulo,
        datos.tipo,
        datos.texto,
        datos.imagenRuta,
        datos.enlaceUrl,
        datos.activa ? 1 : 0,
        datos.orden,
      ]
    );
    return resultado.insertId;
  }

  async actualizar(id, datos) {
    await pool.execute(
      `UPDATE publicidad_blog SET
         anunciante = ?, titulo = ?, tipo = ?, texto = ?, imagen_ruta = ?,
         enlace_url = ?, activa = ?, orden_visualizacion = ?
       WHERE id = ?`,
      [
        datos.anunciante,
        datos.titulo,
        datos.tipo,
        datos.texto,
        datos.imagenRuta,
        datos.enlaceUrl,
        datos.activa ? 1 : 0,
        datos.orden,
        id,
      ]
    );
  }

  async reemplazarPublicaciones(publicidadId, publicacionIds) {
    await pool.execute(
      'DELETE FROM publicidad_blog_publicacion WHERE publicidad_id = ?',
      [publicidadId]
    );
    for (const publicacionId of publicacionIds) {
      await pool.execute(
        `INSERT INTO publicidad_blog_publicacion (publicidad_id, publicacion_id) VALUES (?, ?)`,
        [publicidadId, publicacionId]
      );
    }
  }

  async filtrarPublicacionesExistentes(ids) {
    if (!ids.length) return [];
    const [filas] = await pool.execute(
      `SELECT id FROM publicaciones_blog WHERE id IN (${idsPlaceholders(ids)})`,
      ids
    );
    return filas.map((fila) => fila.id);
  }

  async listarPublicacionesElegibles() {
    const [filas] = await pool.execute(
      `SELECT p.id, p.titulo, p.estado, m.nombre_comercial AS marca_nombre
       FROM publicaciones_blog p
       INNER JOIN marcas m ON m.id = p.marca_id
       ORDER BY m.nombre_comercial ASC, p.titulo ASC`
    );
    return filas;
  }
}
