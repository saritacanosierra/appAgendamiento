import { pool } from '../configuracion/baseDatos.js';

export class RecuperacionContrasenaRepositorio {
  async invalidarPendientes(usuarioId) {
    await pool.execute(
      `UPDATE recuperaciones_contrasena
       SET usado_en = NOW()
       WHERE usuario_id = ? AND usado_en IS NULL`,
      [usuarioId]
    );
  }

  async crear({ usuarioId, tokenHash, expiraEn }) {
    await pool.execute(
      `INSERT INTO recuperaciones_contrasena (usuario_id, token_hash, expira_en)
       VALUES (?, ?, ?)`,
      [usuarioId, tokenHash, expiraEn]
    );
  }

  async consumir(tokenHash) {
    const [resultado] = await pool.execute(
      `UPDATE recuperaciones_contrasena
       SET usado_en = NOW()
       WHERE token_hash = ?
         AND usado_en IS NULL
         AND expira_en > NOW()`,
      [tokenHash]
    );
    if (resultado.affectedRows < 1) return null;

    const [filas] = await pool.execute(
      `SELECT r.usuario_id, u.correo, u.rol, u.activo
       FROM recuperaciones_contrasena r
       INNER JOIN usuarios u ON u.id = r.usuario_id
       WHERE r.token_hash = ?
       LIMIT 1`,
      [tokenHash]
    );
    return filas[0] ?? null;
  }
}
