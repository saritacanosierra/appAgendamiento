import crypto from 'crypto';
import { pool } from '../configuracion/baseDatos.js';
import { parsearJsonCampo } from '../utilidades/mapeador.js';
export { ReservaRepositorio, ClienteRepositorio } from './citasRepositorio.js';

export class ServicioRepositorio {
  async listarActivosPorMarca(marcaId) {
    const [filas] = await pool.execute(
      `SELECT id, marca_id, nombre, descripcion, duracion_minutos, precio, orden_visualizacion
       FROM servicios
       WHERE marca_id = ? AND activo = 1
       ORDER BY orden_visualizacion ASC, nombre ASC`,
      [marcaId]
    );
    return filas;
  }

  async listarPorMarca(marcaId) {
    const [filas] = await pool.execute(
      `SELECT id, marca_id, nombre, descripcion, duracion_minutos, precio, activo, orden_visualizacion
       FROM servicios
       WHERE marca_id = ?
       ORDER BY orden_visualizacion ASC, nombre ASC`,
      [marcaId]
    );
    return filas;
  }

  async buscarActivoPorId(marcaId, servicioId) {
    const [filas] = await pool.execute(
      `SELECT * FROM servicios WHERE id = ? AND marca_id = ? AND activo = 1 LIMIT 1`,
      [servicioId, marcaId]
    );
    return filas[0] ?? null;
  }

  async buscarPorId(marcaId, servicioId) {
    const [filas] = await pool.execute(
      `SELECT * FROM servicios WHERE id = ? AND marca_id = ? LIMIT 1`,
      [servicioId, marcaId]
    );
    return filas[0] ?? null;
  }

  async crear(datos) {
    const [resultado] = await pool.execute(
      `INSERT INTO servicios (marca_id, nombre, descripcion, duracion_minutos, precio, activo, orden_visualizacion)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.marcaId,
        datos.nombre,
        datos.descripcion ?? null,
        datos.duracionMinutos,
        datos.precio,
        datos.activo ? 1 : 0,
        datos.ordenVisualizacion ?? 0,
      ]
    );
    return resultado.insertId;
  }

  async actualizar(marcaId, servicioId, datos) {
    await pool.execute(
      `UPDATE servicios
       SET nombre = ?, descripcion = ?, duracion_minutos = ?, precio = ?,
           activo = ?, orden_visualizacion = ?
       WHERE id = ? AND marca_id = ?`,
      [
        datos.nombre,
        datos.descripcion ?? null,
        datos.duracionMinutos,
        datos.precio,
        datos.activo ? 1 : 0,
        datos.ordenVisualizacion ?? 0,
        servicioId,
        marcaId,
      ]
    );
  }
}

export class MarcaRepositorio {
  async buscarPorSlug(slug) {
    const [filas] = await pool.execute(
      `SELECT m.*, c.color_fondo, c.color_texto, c.tipografia
       FROM marcas m
       LEFT JOIN configuraciones_marca c ON c.marca_id = m.id
       WHERE m.slug = ? AND m.activa = 1
       LIMIT 1`,
      [slug]
    );
    return filas[0] ?? null;
  }

  async buscarPorId(marcaId) {
    const [filas] = await pool.execute(
      `SELECT m.*, c.color_fondo, c.color_texto, c.tipografia
       FROM marcas m
       LEFT JOIN configuraciones_marca c ON c.marca_id = m.id
       WHERE m.id = ? AND m.activa = 1
       LIMIT 1`,
      [marcaId]
    );
    return filas[0] ?? null;
  }
}

export class UsuarioRepositorio {
  async buscarPorCorreo(correo) {
    const [filas] = await pool.execute(
      'SELECT * FROM usuarios WHERE correo = ? AND activo = 1 LIMIT 1',
      [correo]
    );
    return filas[0] ?? null;
  }

  async buscarPorId(id) {
    const [filas] = await pool.execute(
      'SELECT id, marca_id, nombre, correo, rol, activo FROM usuarios WHERE id = ? AND activo = 1 LIMIT 1',
      [id]
    );
    return filas[0] ?? null;
  }

  async actualizarUltimoAcceso(id) {
    await pool.execute(
      'UPDATE usuarios SET ultimo_acceso_at = NOW() WHERE id = ?',
      [id]
    );
  }
}

export class TokenRepositorio {
  async crear({ usuarioId, marcaId, tokenHash, expiraEn }) {
    await pool.execute(
      `INSERT INTO tokens_sesion (usuario_id, marca_id, token_hash, expira_en)
       VALUES (?, ?, ?, ?)`,
      [usuarioId, marcaId, tokenHash, expiraEn]
    );
  }

  async buscarValido(tokenHash) {
    const [filas] = await pool.execute(
      `SELECT t.*, u.nombre AS usuario_nombre, u.correo AS usuario_correo, u.rol AS usuario_rol
       FROM tokens_sesion t
       INNER JOIN usuarios u ON u.id = t.usuario_id AND u.activo = 1
       WHERE t.token_hash = ?
         AND t.revocado = 0
         AND t.expira_en > NOW()
       LIMIT 1`,
      [tokenHash]
    );
    return filas[0] ?? null;
  }

  async revocar(tokenHash) {
    await pool.execute(
      'UPDATE tokens_sesion SET revocado = 1 WHERE token_hash = ?',
      [tokenHash]
    );
  }

  async limpiarExpirados() {
    await pool.execute(
      'DELETE FROM tokens_sesion WHERE expira_en < NOW() OR revocado = 1'
    );
  }
}

export function generarCodigoConfirmacion() {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}

export { parsearJsonCampo };
