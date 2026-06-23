import { pool } from '../configuracion/baseDatos.js';

const SELECT_CITA_BASE = `
  SELECT c.*,
         cl.id AS cliente_id_ref, cl.nombre AS cliente_nombre, cl.telefono AS cliente_telefono, cl.correo AS cliente_correo,
         s.id AS servicio_id_ref, s.nombre AS servicio_nombre, s.duracion_minutos, s.precio
  FROM citas c
  INNER JOIN clientes cl ON cl.id = c.cliente_id
  INNER JOIN servicios s ON s.id = c.servicio_id
  WHERE c.marca_id = ?
`;

export class ReservaRepositorio {
  async listarOcupadasPorFecha(marcaId, fecha) {
    const [filas] = await pool.execute(
      `SELECT hora_inicio, hora_fin FROM citas
       WHERE marca_id = ? AND fecha = ? AND estado != 'cancelada'`,
      [marcaId, fecha]
    );
    return filas;
  }

  async existeSolapamiento(conexion, marcaId, fecha, horaInicio, horaFin, excluirId = null) {
    let sql = `SELECT id FROM citas
       WHERE marca_id = ? AND fecha = ? AND estado != 'cancelada'
         AND hora_inicio < ? AND hora_fin > ?`;
    const params = [marcaId, fecha, horaFin, horaInicio];

    if (excluirId) {
      sql += ' AND id != ?';
      params.push(excluirId);
    }

    sql += ' LIMIT 1';
    const [filas] = await conexion.execute(sql, params);
    return filas.length > 0;
  }

  async crear(conexion, datos) {
    const [resultado] = await conexion.execute(
      `INSERT INTO citas (
         marca_id, cliente_id, servicio_id, codigo_confirmacion,
         fecha, hora_inicio, hora_fin, estado, notas_internas
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.marcaId,
        datos.clienteId,
        datos.servicioId,
        datos.codigoConfirmacion,
        datos.fecha,
        datos.horaInicio,
        datos.horaFin,
        datos.estado ?? 'pendiente',
        datos.notasInternas ?? null,
      ]
    );
    return resultado.insertId;
  }

  async buscarPorCodigo(codigo) {
    const [filas] = await pool.execute(
      `SELECT c.*,
              s.nombre AS servicio_nombre, s.duracion_minutos, s.precio,
              cl.nombre AS cliente_nombre, cl.telefono AS cliente_telefono, cl.correo AS cliente_correo,
              m.nombre_comercial, m.slug AS marca_slug, m.direccion AS marca_direccion
       FROM citas c
       INNER JOIN servicios s ON s.id = c.servicio_id
       INNER JOIN clientes cl ON cl.id = c.cliente_id
       INNER JOIN marcas m ON m.id = c.marca_id
       WHERE c.codigo_confirmacion = ?
       LIMIT 1`,
      [codigo]
    );
    return filas[0] ?? null;
  }

  async buscarPorId(marcaId, citaId) {
    const [filas] = await pool.execute(
      `${SELECT_CITA_BASE} AND c.id = ? LIMIT 1`,
      [marcaId, citaId]
    );
    return filas[0] ?? null;
  }

  async listarPorMarca(marcaId, filtros = {}) {
    let sql = `${SELECT_CITA_BASE}`;
    const params = [marcaId];

    if (filtros.fecha) {
      sql += ' AND c.fecha = ?';
      params.push(filtros.fecha);
    }
    if (filtros.desde && filtros.hasta) {
      sql += ' AND c.fecha BETWEEN ? AND ?';
      params.push(filtros.desde, filtros.hasta);
    }
    if (filtros.estado) {
      sql += ' AND c.estado = ?';
      params.push(filtros.estado);
    }

    sql += ' ORDER BY c.fecha ASC, c.hora_inicio ASC';
    const [filas] = await pool.execute(sql, params);
    return filas;
  }

  async actualizar(conexion, marcaId, citaId, datos) {
    const campos = [];
    const params = [];

    if (datos.fecha !== undefined) {
      campos.push('fecha = ?');
      params.push(datos.fecha);
    }
    if (datos.horaInicio !== undefined) {
      campos.push('hora_inicio = ?');
      params.push(datos.horaInicio);
    }
    if (datos.horaFin !== undefined) {
      campos.push('hora_fin = ?');
      params.push(datos.horaFin);
    }
    if (datos.estado !== undefined) {
      campos.push('estado = ?');
      params.push(datos.estado);
    }
    if (datos.notasInternas !== undefined) {
      campos.push('notas_internas = ?');
      params.push(datos.notasInternas);
    }

    if (campos.length === 0) return false;

    params.push(citaId, marcaId);
    const [resultado] = await conexion.execute(
      `UPDATE citas SET ${campos.join(', ')} WHERE id = ? AND marca_id = ?`,
      params
    );
    return resultado.affectedRows > 0;
  }
}

export class ClienteRepositorio {
  async buscarPorTelefono(marcaId, telefono) {
    const [filas] = await pool.execute(
      `SELECT * FROM clientes WHERE marca_id = ? AND telefono = ? AND activo = 1 LIMIT 1`,
      [marcaId, telefono]
    );
    return filas[0] ?? null;
  }

  async buscarPorId(marcaId, clienteId) {
    const [filas] = await pool.execute(
      `SELECT * FROM clientes WHERE id = ? AND marca_id = ? AND activo = 1 LIMIT 1`,
      [clienteId, marcaId]
    );
    return filas[0] ?? null;
  }

  async listarPorMarca(marcaId, busqueda = '') {
    let sql = `SELECT id, marca_id, nombre, telefono, correo, notas, created_at
               FROM clientes WHERE marca_id = ? AND activo = 1`;
    const params = [marcaId];

    if (busqueda) {
      sql += ' AND (nombre LIKE ? OR telefono LIKE ?)';
      const like = `%${busqueda}%`;
      params.push(like, like);
    }

    sql += ' ORDER BY nombre ASC';
    const [filas] = await pool.execute(sql, params);
    return filas;
  }

  async crear(conexion, { marcaId, nombre, telefono, correo, notas }) {
    const db = conexion ?? pool;
    const [resultado] = await db.execute(
      `INSERT INTO clientes (marca_id, nombre, telefono, correo, notas, activo)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [marcaId, nombre, telefono, correo || null, notas || null]
    );
    return resultado.insertId;
  }

  async actualizarDatos(conexion, clienteId, { nombre, correo }) {
    await conexion.execute(
      `UPDATE clientes SET nombre = ?, correo = COALESCE(?, correo) WHERE id = ?`,
      [nombre, correo || null, clienteId]
    );
  }
}
