import { pool } from '../configuracion/baseDatos.js';

export class CitaDisenosGaleriaRepositorio {
  async listarIdsPorCita(marcaId, citaId) {
    const [filas] = await pool.execute(
      `SELECT diseno_id FROM cita_disenos_galeria
       WHERE marca_id = ? AND cita_id = ?
       ORDER BY created_at ASC`,
      [marcaId, citaId]
    );
    return filas.map((f) => Number(f.diseno_id));
  }

  async listarPorCita(marcaId, citaId) {
    const [filas] = await pool.execute(
      `SELECT cd.id, cd.diseno_id, cd.telefono, cd.created_at,
              d.titulo, d.imagen_ruta, d.categoria, d.temporada
       FROM cita_disenos_galeria cd
       INNER JOIN disenos_galeria d ON d.id = cd.diseno_id
       WHERE cd.marca_id = ? AND cd.cita_id = ?
       ORDER BY cd.created_at ASC`,
      [marcaId, citaId]
    );
    return filas;
  }

  async listarPorCitas(marcaId, citaIds) {
    const ids = [...new Set((citaIds ?? []).map((id) => Number(id)).filter(Boolean))];
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => '?').join(',');
    const [filas] = await pool.execute(
      `SELECT cd.cita_id, cd.diseno_id, cd.telefono, cd.created_at,
              d.titulo, d.imagen_ruta, d.categoria, d.temporada
       FROM cita_disenos_galeria cd
       INNER JOIN disenos_galeria d ON d.id = cd.diseno_id
       WHERE cd.marca_id = ? AND cd.cita_id IN (${placeholders})
       ORDER BY cd.created_at ASC`,
      [marcaId, ...ids]
    );
    return filas;
  }

  async agregar({ marcaId, citaId, disenoId, telefono }) {
    const [resultado] = await pool.execute(
      `INSERT INTO cita_disenos_galeria (marca_id, cita_id, diseno_id, telefono)
       VALUES (?, ?, ?, ?)`,
      [marcaId, citaId, disenoId, telefono]
    );
    return resultado.insertId;
  }

  async quitar(marcaId, citaId, disenoId) {
    const [resultado] = await pool.execute(
      `DELETE FROM cita_disenos_galeria
       WHERE marca_id = ? AND cita_id = ? AND diseno_id = ?`,
      [marcaId, citaId, disenoId]
    );
    return resultado.affectedRows > 0;
  }

  async existe(marcaId, citaId, disenoId) {
    const [filas] = await pool.execute(
      `SELECT id FROM cita_disenos_galeria
       WHERE marca_id = ? AND cita_id = ? AND diseno_id = ?
       LIMIT 1`,
      [marcaId, citaId, disenoId]
    );
    return Boolean(filas[0]);
  }

  async existeDisenoParaTelefono(marcaId, telefono, disenoId) {
    const [filas] = await pool.execute(
      `SELECT id FROM cita_disenos_galeria
       WHERE marca_id = ? AND telefono = ? AND diseno_id = ?
       LIMIT 1`,
      [marcaId, telefono, disenoId]
    );
    return Boolean(filas[0]);
  }

  async quitarPorTelefonoYDiseno(marcaId, telefono, disenoId) {
    const [resultado] = await pool.execute(
      `DELETE FROM cita_disenos_galeria
       WHERE marca_id = ? AND telefono = ? AND diseno_id = ?`,
      [marcaId, telefono, disenoId]
    );
    return resultado.affectedRows;
  }
}
