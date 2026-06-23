import { pool } from '../configuracion/baseDatos.js';

export class ConfiguracionRepositorio {
  async obtenerAdmin(marcaId) {
    const [filas] = await pool.execute(
      `SELECT m.*, c.color_fondo, c.color_texto, c.tipografia, c.configuracion_json
       FROM marcas m
       LEFT JOIN configuraciones_marca c ON c.marca_id = m.id
       WHERE m.id = ?
       LIMIT 1`,
      [marcaId]
    );
    return filas[0] ?? null;
  }

  async actualizarMarca(marcaId, datos) {
    await pool.execute(
      `UPDATE marcas
       SET nombre_comercial = ?, color_principal = ?, color_secundario = ?,
           logo_ruta = ?, descripcion = ?, telefono = ?, whatsapp = ?,
           direccion = ?, horarios_json = ?
       WHERE id = ?`,
      [
        datos.nombreComercial,
        datos.colorPrincipal,
        datos.colorSecundario,
        datos.logoRuta ?? null,
        datos.descripcion ?? null,
        datos.telefono ?? null,
        datos.whatsapp ?? null,
        datos.direccion ?? null,
        datos.horariosJson ? JSON.stringify(datos.horariosJson) : null,
        marcaId,
      ]
    );
  }

  async upsertConfiguracionVisual(marcaId, datos) {
    const [existentes] = await pool.execute(
      `SELECT id FROM configuraciones_marca WHERE marca_id = ? LIMIT 1`,
      [marcaId]
    );

    if (existentes[0]) {
      await pool.execute(
        `UPDATE configuraciones_marca
         SET color_fondo = ?, color_texto = ?, tipografia = ?
         WHERE marca_id = ?`,
        [datos.colorFondo, datos.colorTexto, datos.tipografia ?? 'system-ui', marcaId]
      );
    } else {
      await pool.execute(
        `INSERT INTO configuraciones_marca (marca_id, color_fondo, color_texto, tipografia)
         VALUES (?, ?, ?, ?)`,
        [marcaId, datos.colorFondo, datos.colorTexto, datos.tipografia ?? 'system-ui']
      );
    }
  }

  async obtenerConfiguracionJson(marcaId) {
    const [filas] = await pool.execute(
      `SELECT configuracion_json FROM configuraciones_marca WHERE marca_id = ? LIMIT 1`,
      [marcaId]
    );
    const raw = filas[0]?.configuracion_json;
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  async actualizarConfiguracionJson(marcaId, parcial) {
    const actual = await this.obtenerConfiguracionJson(marcaId);
    const fusionado = { ...actual, ...parcial };

    const [existentes] = await pool.execute(
      `SELECT id FROM configuraciones_marca WHERE marca_id = ? LIMIT 1`,
      [marcaId]
    );

    const json = JSON.stringify(fusionado);

    if (existentes[0]) {
      await pool.execute(
        `UPDATE configuraciones_marca SET configuracion_json = ? WHERE marca_id = ?`,
        [json, marcaId]
      );
    } else {
      await pool.execute(
        `INSERT INTO configuraciones_marca (marca_id, configuracion_json) VALUES (?, ?)`,
        [marcaId, json]
      );
    }

    return fusionado;
  }
}
