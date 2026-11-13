import { pool } from '../configuracion/baseDatos.js';

export class PagoWompiRepositorio {
  async crear({ marcaId, referencia, montoCentavos, planTipo }) {
    const [resultado] = await pool.execute(
      `INSERT INTO pagos_wompi (marca_id, referencia, monto_centavos, plan_tipo, estado)
       VALUES (?, ?, ?, ?, 'pendiente')`,
      [marcaId, referencia, montoCentavos, planTipo]
    );
    return resultado.insertId;
  }

  async buscarPorReferencia(referencia) {
    const [filas] = await pool.execute(
      `SELECT * FROM pagos_wompi WHERE referencia = ? LIMIT 1`,
      [referencia]
    );
    return filas[0] ?? null;
  }

  async marcar(referencia, estado, transaccionId = null) {
    const [resultado] = await pool.execute(
      `UPDATE pagos_wompi
       SET estado = ?, transaccion_id = COALESCE(?, transaccion_id)
       WHERE referencia = ? AND estado = 'pendiente'`,
      [estado, transaccionId, referencia]
    );
    return resultado.affectedRows > 0;
  }
}
