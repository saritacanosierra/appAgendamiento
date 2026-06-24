import { pool } from '../configuracion/baseDatos.js';

export class GaleriaCatalogoRepositorio {
  async listarPorMarca(marcaId, { tipo = null, soloActivos = false } = {}) {
    const params = [marcaId];
    let sql = `SELECT id, marca_id, tipo, etiqueta, valor, activo, orden_visualizacion,
                      created_at, updated_at
               FROM galeria_catalogo
               WHERE marca_id = ?`;

    if (tipo) {
      sql += ' AND tipo = ?';
      params.push(tipo);
    }

    if (soloActivos) {
      sql += ' AND activo = 1';
    }

    sql += ' ORDER BY orden_visualizacion ASC, etiqueta ASC';

    const [filas] = await pool.execute(sql, params);
    return filas;
  }

  async buscarPorId(marcaId, id) {
    const [filas] = await pool.execute(
      `SELECT * FROM galeria_catalogo WHERE id = ? AND marca_id = ? LIMIT 1`,
      [id, marcaId]
    );
    return filas[0] ?? null;
  }

  async buscarPorValor(marcaId, tipo, valor) {
    const [filas] = await pool.execute(
      `SELECT * FROM galeria_catalogo
       WHERE marca_id = ? AND tipo = ? AND valor = ?
       LIMIT 1`,
      [marcaId, tipo, valor]
    );
    return filas[0] ?? null;
  }

  async valorExiste(marcaId, tipo, valor, excluirId = null) {
    const params = [marcaId, tipo, valor];
    let sql = `SELECT id FROM galeria_catalogo WHERE marca_id = ? AND tipo = ? AND valor = ?`;

    if (excluirId) {
      sql += ' AND id != ?';
      params.push(excluirId);
    }

    const [filas] = await pool.execute(sql, params);
    return filas.length > 0;
  }

  async crear(datos) {
    const [resultado] = await pool.execute(
      `INSERT INTO galeria_catalogo
       (marca_id, tipo, etiqueta, valor, activo, orden_visualizacion)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        datos.marcaId,
        datos.tipo,
        datos.etiqueta,
        datos.valor,
        datos.activo ? 1 : 0,
        datos.ordenVisualizacion ?? 0,
      ]
    );
    return resultado.insertId;
  }

  async actualizar(marcaId, id, datos) {
    await pool.execute(
      `UPDATE galeria_catalogo
       SET etiqueta = ?, activo = ?, orden_visualizacion = ?
       WHERE id = ? AND marca_id = ?`,
      [
        datos.etiqueta,
        datos.activo ? 1 : 0,
        datos.ordenVisualizacion ?? 0,
        id,
        marcaId,
      ]
    );
  }

  async eliminar(marcaId, id) {
    await pool.execute(
      `DELETE FROM galeria_catalogo WHERE id = ? AND marca_id = ?`,
      [id, marcaId]
    );
  }

  async contarDisenosConValor(marcaId, tipo, valor) {
    const columna = tipo === 'categoria' ? 'categoria' : 'temporada';
    const [filas] = await pool.execute(
      `SELECT COUNT(*) AS total FROM disenos_galeria
       WHERE marca_id = ? AND ${columna} = ?`,
      [marcaId, valor]
    );
    return Number(filas[0]?.total ?? 0);
  }
}
