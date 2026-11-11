import { pool } from '../configuracion/baseDatos.js';

const CITAS_ACTIVAS_SQL = `
  c.estado IN ('pendiente', 'confirmada')
  AND (
    c.fecha > CURDATE()
    OR (c.fecha = CURDATE() AND c.hora_inicio > CURTIME())
  )
`;

export class SeleccionesGaleriaTelefonoRepositorio {
  async listarIds(marcaId, telefono) {
    const [filas] = await pool.execute(
      `SELECT diseno_id FROM selecciones_galeria_telefono
       WHERE marca_id = ? AND telefono = ?
       ORDER BY created_at ASC`,
      [marcaId, telefono]
    );
    return filas.map((fila) => Number(fila.diseno_id));
  }

  async agregar({ marcaId, telefono, disenoId }) {
    const [resultado] = await pool.execute(
      `INSERT IGNORE INTO selecciones_galeria_telefono (marca_id, telefono, diseno_id)
       VALUES (?, ?, ?)`,
      [marcaId, telefono, disenoId]
    );
    return resultado.affectedRows > 0;
  }

  async quitar(marcaId, telefono, disenoId) {
    const [resultado] = await pool.execute(
      `DELETE FROM selecciones_galeria_telefono
       WHERE marca_id = ? AND telefono = ? AND diseno_id = ?`,
      [marcaId, telefono, disenoId]
    );
    return resultado.affectedRows > 0;
  }

  async reasignarTelefono(marcaId, telefonoAnterior, telefonoNuevo) {
    if (!telefonoAnterior || telefonoAnterior === telefonoNuevo) return 0;
    const [resultado] = await pool.execute(
      `UPDATE IGNORE selecciones_galeria_telefono
       SET telefono = ?
       WHERE marca_id = ? AND telefono = ?`,
      [telefonoNuevo, marcaId, telefonoAnterior]
    );
    return resultado.affectedRows;
  }

  async copiarACita(marcaId, telefono, citaId) {
    const [resultado] = await pool.execute(
      `INSERT IGNORE INTO cita_disenos_galeria (marca_id, cita_id, diseno_id, telefono)
       SELECT marca_id, ?, diseno_id, telefono
       FROM selecciones_galeria_telefono
       WHERE marca_id = ? AND telefono = ?`,
      [citaId, marcaId, telefono]
    );
    return resultado.affectedRows;
  }

  async vincularDisenoACitasActivas(marcaId, telefono, disenoId) {
    await pool.execute(
      `INSERT IGNORE INTO cita_disenos_galeria (marca_id, cita_id, diseno_id, telefono)
       SELECT c.marca_id, c.id, ?, ?
       FROM citas c
       INNER JOIN clientes cl ON cl.id = c.cliente_id AND cl.marca_id = c.marca_id
       WHERE c.marca_id = ?
         AND cl.telefono = ?
         AND ${CITAS_ACTIVAS_SQL}`,
      [disenoId, telefono, marcaId, telefono]
    );
  }

  async quitarDisenoDeCitasActivas(marcaId, telefono, disenoId) {
    await pool.execute(
      `DELETE cd FROM cita_disenos_galeria cd
       INNER JOIN citas c ON c.id = cd.cita_id AND c.marca_id = cd.marca_id
       INNER JOIN clientes cl ON cl.id = c.cliente_id AND cl.marca_id = c.marca_id
       WHERE cd.marca_id = ?
         AND cl.telefono = ?
         AND cd.diseno_id = ?
         AND ${CITAS_ACTIVAS_SQL}`,
      [marcaId, telefono, disenoId]
    );
  }
}
