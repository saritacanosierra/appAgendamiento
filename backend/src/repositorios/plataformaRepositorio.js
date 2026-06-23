import { pool } from '../configuracion/baseDatos.js';

export class ConfiguracionPlataformaRepositorio {
  async obtener(clave) {
    const [filas] = await pool.execute(
      'SELECT valor FROM configuracion_plataforma WHERE clave = ? LIMIT 1',
      [clave]
    );
    return filas[0]?.valor ?? null;
  }

  async guardar(clave, valor) {
    await pool.execute(
      `INSERT INTO configuracion_plataforma (clave, valor) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
      [clave, valor ?? null]
    );
  }
}

export class MarcaPlataformaRepositorio {
  async listar() {
    const [filas] = await pool.execute(
      `SELECT m.*,
              (SELECT COUNT(*) FROM usuarios u WHERE u.marca_id = m.id AND u.activo = 1) AS total_usuarios,
              (SELECT COUNT(*) FROM citas c WHERE c.marca_id = m.id) AS total_citas,
              (SELECT u.correo FROM usuarios u
               WHERE u.marca_id = m.id AND u.rol = 'admin' AND u.activo = 1
               ORDER BY u.id ASC LIMIT 1) AS admin_correo,
              (SELECT u.nombre FROM usuarios u
               WHERE u.marca_id = m.id AND u.rol = 'admin' AND u.activo = 1
               ORDER BY u.id ASC LIMIT 1) AS admin_nombre
       FROM marcas m
       ORDER BY m.nombre_comercial ASC`
    );
    return filas;
  }

  async buscarPorId(marcaId) {
    const [filas] = await pool.execute(
      `SELECT m.*,
              (SELECT COUNT(*) FROM usuarios u WHERE u.marca_id = m.id AND u.activo = 1) AS total_usuarios,
              (SELECT COUNT(*) FROM citas c WHERE c.marca_id = m.id) AS total_citas,
              (SELECT u.correo FROM usuarios u
               WHERE u.marca_id = m.id AND u.rol = 'admin' AND u.activo = 1
               ORDER BY u.id ASC LIMIT 1) AS admin_correo,
              (SELECT u.nombre FROM usuarios u
               WHERE u.marca_id = m.id AND u.rol = 'admin' AND u.activo = 1
               ORDER BY u.id ASC LIMIT 1) AS admin_nombre
       FROM marcas m
       WHERE m.id = ?
       LIMIT 1`,
      [marcaId]
    );
    return filas[0] ?? null;
  }

  async obtenerResumen() {
    const [filas] = await pool.execute(
      `SELECT
         COUNT(*) AS total_marcas,
         SUM(CASE WHEN activa = 1 THEN 1 ELSE 0 END) AS marcas_activas,
         SUM(CASE WHEN plan_habilitado = 1 THEN 1 ELSE 0 END) AS marcas_con_plan
       FROM marcas`
    );
    const [totales] = await pool.execute(
      `SELECT
         (SELECT COUNT(*) FROM citas) AS total_citas,
         (SELECT COUNT(*) FROM usuarios WHERE marca_id IS NOT NULL AND activo = 1) AS total_usuarios_marca,
         (SELECT COUNT(*) FROM configuraciones_marca
          WHERE JSON_EXTRACT(configuracion_json, '$.google_calendar.refresh_token') IS NOT NULL
            AND JSON_UNQUOTE(JSON_EXTRACT(configuracion_json, '$.google_calendar.refresh_token')) != ''
         ) AS marcas_con_google`
    );
    return {
      ...filas[0],
      total_citas: totales[0]?.total_citas ?? 0,
      total_usuarios_marca: totales[0]?.total_usuarios_marca ?? 0,
      marcas_con_google: totales[0]?.marcas_con_google ?? 0,
    };
  }

  async buscarPorIdSimple(marcaId) {
    const [filas] = await pool.execute(
      'SELECT * FROM marcas WHERE id = ? LIMIT 1',
      [marcaId]
    );
    return filas[0] ?? null;
  }

  async slugExiste(slug, excluirId = null) {
    const params = [slug];
    let sql = 'SELECT id FROM marcas WHERE slug = ?';
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
      `INSERT INTO marcas (
         nombre_comercial, slug, color_principal, color_secundario,
         descripcion, telefono, whatsapp, direccion, activa, plan_habilitado
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.nombreComercial,
        datos.slug,
        datos.colorPrincipal ?? '#C2185B',
        datos.colorSecundario ?? '#F8BBD0',
        datos.descripcion ?? null,
        datos.telefono ?? null,
        datos.whatsapp ?? null,
        datos.direccion ?? null,
        datos.activa ? 1 : 0,
        datos.planHabilitado ? 1 : 0,
      ]
    );
    return resultado.insertId;
  }

  async actualizar(marcaId, datos) {
    await pool.execute(
      `UPDATE marcas SET
         nombre_comercial = ?, slug = ?, activa = ?, plan_habilitado = ?,
         telefono = ?, whatsapp = ?, direccion = ?
       WHERE id = ?`,
      [
        datos.nombreComercial,
        datos.slug,
        datos.activa ? 1 : 0,
        datos.planHabilitado ? 1 : 0,
        datos.telefono ?? null,
        datos.whatsapp ?? null,
        datos.direccion ?? null,
        marcaId,
      ]
    );
  }

  async crearConfiguracionVisual(marcaId) {
    await pool.execute(
      `INSERT INTO configuraciones_marca (marca_id, color_fondo, color_texto, tipografia)
       VALUES (?, '#FFFFFF', '#1A1A1A', 'system-ui')`,
      [marcaId]
    );
  }
}
