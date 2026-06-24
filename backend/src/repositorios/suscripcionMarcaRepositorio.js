import { pool } from '../configuracion/baseDatos.js';

export class SuscripcionMarcaRepositorio {
  async listarMarcasConVigencia() {
    const [filas] = await pool.execute(
      `SELECT id, nombre_comercial, slug, activa, plan_habilitado,
              plan_tipo, plan_inicio_en, plan_vence_en, plan_monto,
              plan_ultima_facturacion_en,
              plan_aviso_7_en, plan_aviso_3_en, plan_aviso_1_en, plan_aviso_vencido_en
       FROM marcas
       WHERE plan_vence_en IS NOT NULL`
    );
    return filas;
  }

  async actualizarPlan(marcaId, datos) {
    await pool.execute(
      `UPDATE marcas SET
         plan_tipo = ?,
         plan_inicio_en = ?,
         plan_vence_en = ?,
         plan_monto = ?,
         plan_ultima_facturacion_en = ?,
         plan_habilitado = ?,
         plan_aviso_7_en = NULL,
         plan_aviso_3_en = NULL,
         plan_aviso_1_en = NULL,
         plan_aviso_vencido_en = NULL
       WHERE id = ?`,
      [
        datos.planTipo,
        datos.inicioEn,
        datos.venceEn,
        datos.monto ?? null,
        datos.ultimaFacturacionEn,
        datos.planHabilitado ? 1 : 0,
        marcaId,
      ]
    );
  }

  async marcarPlanVencido(marcaId) {
    await pool.execute(
      `UPDATE marcas SET plan_habilitado = 0 WHERE id = ?`,
      [marcaId]
    );
  }

  async registrarAvisoEnviado(marcaId, diasAntes) {
    const columna = {
      7: 'plan_aviso_7_en',
      3: 'plan_aviso_3_en',
      1: 'plan_aviso_1_en',
    }[diasAntes];

    if (!columna) return;

    await pool.execute(
      `UPDATE marcas SET ${columna} = CURDATE() WHERE id = ?`,
      [marcaId]
    );
  }

  async avisoYaEnviado(marca, diasAntes) {
    const campo = {
      7: 'plan_aviso_7_en',
      3: 'plan_aviso_3_en',
      1: 'plan_aviso_1_en',
    }[diasAntes];
    return Boolean(marca?.[campo]);
  }

  async marcarAvisoVencidoEnviado(marcaId) {
    await pool.execute(
      `UPDATE marcas SET plan_aviso_vencido_en = CURDATE(), plan_habilitado = 0 WHERE id = ?`,
      [marcaId]
    );
  }

  async registrarHistorial({ marcaId, planTipo, monto, inicioEn, venceEn, accion }) {
    const [resultado] = await pool.execute(
      `INSERT INTO historial_suscripciones_marca
       (marca_id, plan_tipo, monto, inicio_en, vence_en, accion)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [marcaId, planTipo, monto ?? null, inicioEn, venceEn, accion]
    );
    return resultado.insertId;
  }

  async listarHistorial(marcaId, limite = 20) {
    const [filas] = await pool.execute(
      `SELECT id, plan_tipo, monto, inicio_en, vence_en, accion, created_at
       FROM historial_suscripciones_marca
       WHERE marca_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [marcaId, limite]
    );
    return filas;
  }

  async contarPorVencer(dias = 7) {
    const [filas] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM marcas
       WHERE plan_habilitado = 1
         AND plan_vence_en IS NOT NULL
         AND plan_vence_en >= CURDATE()
         AND plan_vence_en <= DATE_ADD(CURDATE(), INTERVAL ? DAY)`,
      [dias]
    );
    return Number(filas[0]?.total ?? 0);
  }

  async contarVencidas() {
    const [filas] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM marcas
       WHERE plan_vence_en IS NOT NULL
         AND plan_vence_en < CURDATE()`
    );
    return Number(filas[0]?.total ?? 0);
  }
}
