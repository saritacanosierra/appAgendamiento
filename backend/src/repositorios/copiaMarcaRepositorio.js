import { pool } from '../configuracion/baseDatos.js';

/**
 * Tablas que pertenecen a una sola empresa.
 * tokens_sesion se borra al restaurar y no se guarda: una copia no reabre sesiones.
 * Si aparece otra tabla con marca_id, la copia se niega hasta incluirla aquí.
 */
const TABLAS = [
  'configuraciones_marca',
  'usuarios',
  'estilistas',
  'profesionales',
  'clientes',
  'servicios',
  'publicaciones_blog',
  'galeria_catalogo',
  'disenos_galeria',
  'carrusel_inicio',
  'historial_suscripciones_marca',
  'pagos_wompi',
  'citas',
  'solicitudes_reagendamiento',
  'cliente_favoritos',
  'cita_disenos_galeria',
  'selecciones_galeria_telefono',
  'profesional_excepciones',
  'notificaciones',
];

const BORRADO = [
  'cita_disenos_galeria',
  'selecciones_galeria_telefono',
  'solicitudes_reagendamiento',
  'cliente_favoritos',
  'profesional_excepciones',
  'citas',
  'notificaciones',
  'historial_suscripciones_marca',
  'pagos_wompi',
  'carrusel_inicio',
  'disenos_galeria',
  'galeria_catalogo',
  'publicaciones_blog',
  'servicios',
  'clientes',
  'estilistas',
  'profesionales',
  'configuraciones_marca',
];

const CONOCIDAS = new Set([...TABLAS, 'tokens_sesion', 'marcas']);
const ROLES_MARCA = new Set(['admin', 'staff']);

function citar(nombre) {
  if (!/^[a-z0-9_]+$/i.test(nombre)) {
    throw new ErrorCopia('La copia tiene un dato que no se puede guardar.');
  }
  return `\`${nombre}\``;
}

export class ErrorCopia extends Error {
  constructor(mensaje, codigoHttp = 422) {
    super(mensaje);
    this.codigoHttp = codigoHttp;
    this.esCopia = true;
  }
}

function serializarValor(valor) {
  if (valor === undefined) return null;
  if (valor instanceof Date) {
    const dos = (n) => String(n).padStart(2, '0');
    return `${valor.getFullYear()}-${dos(valor.getMonth() + 1)}-${dos(valor.getDate())} ${dos(valor.getHours())}:${dos(valor.getMinutes())}:${dos(valor.getSeconds())}`;
  }
  if (typeof valor === 'bigint') return Number(valor);
  if (Buffer.isBuffer(valor)) return valor.toString('utf8');
  return valor;
}

function serializarFila(fila) {
  const salida = {};
  for (const [clave, valor] of Object.entries(fila)) {
    salida[clave] = serializarValor(valor);
  }
  return salida;
}

function preparar(valor) {
  if (valor === undefined || valor === null) return null;
  if (typeof valor === 'object') return JSON.stringify(valor);
  return valor;
}

async function columnasDe(conexion, tabla) {
  const [filas] = await conexion.query(`SHOW COLUMNS FROM ${citar(tabla)}`);
  return filas.map((fila) => fila.Field);
}

async function tablasConMarca(conexion) {
  const [filas] = await conexion.query(
    `SELECT DISTINCT TABLE_NAME AS tabla
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME = 'marca_id'`
  );
  return filas.map((fila) => String(fila.tabla ?? fila.TABLE_NAME ?? fila.table_name ?? '').toLowerCase());
}

async function asegurarTablasConocidas(conexion) {
  const encontradas = await tablasConMarca(conexion);
  const desconocida = encontradas.find((tabla) => !CONOCIDAS.has(tabla));
  if (desconocida) {
    throw new ErrorCopia(
      'Hay datos de empresa que esta copia todavía no sabe guardar. No se cambió nada.',
      409
    );
  }
}

async function conflictoUnico(conexion, tabla, columna, valores, marcaId, creando, nulosAjenos = false) {
  const limpios = [...new Set(valores.map((valor) => String(valor ?? '').trim()).filter(Boolean))];
  for (let i = 0; i < limpios.length; i += 100) {
    const lote = limpios.slice(i, i + 100);
    const marcas = lote.map(() => '?').join(', ');
    let sql = `SELECT ${citar(columna)} AS valor FROM ${citar(tabla)} WHERE ${citar(columna)} IN (${marcas})`;
    const params = [...lote];
    if (!creando) {
      sql += nulosAjenos ? ' AND (marca_id IS NULL OR marca_id <> ?)' : ' AND marca_id <> ?';
      params.push(marcaId);
    }
    sql += ' LIMIT 1';
    const [filas] = await conexion.execute(sql, params);
    if (filas.length > 0) return filas[0].valor;
  }
  return null;
}

function filasDe(documento, tabla) {
  const filas = documento.tablas?.[tabla];
  return Array.isArray(filas) ? filas : [];
}

function mapaVacio() {
  return {
    estilistas: new Map(),
    profesionales: new Map(),
    clientes: new Map(),
    servicios: new Map(),
    publicaciones_blog: new Map(),
    disenos_galeria: new Map(),
    citas: new Map(),
  };
}

function idPrevio(fila) {
  const id = Number(fila.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ErrorCopia('La copia trae un registro sin identificador.');
  }
  return id;
}

async function insertar(conexion, tabla, columnas, fila, fijos = {}) {
  const datos = {};
  for (const columna of columnas) {
    if (columna === 'id') continue;
    if (Object.prototype.hasOwnProperty.call(fijos, columna)) {
      datos[columna] = fijos[columna];
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(fila, columna)) {
      datos[columna] = fila[columna];
    }
  }
  const claves = Object.keys(datos);
  const sql = `INSERT INTO ${citar(tabla)} (${claves.map(citar).join(', ')}) VALUES (${claves.map(() => '?').join(', ')})`;
  const [resultado] = await conexion.execute(sql, claves.map((clave) => preparar(datos[clave])));
  return resultado.insertId;
}

function exigirMapa(mapa, id, mensaje) {
  if (id === null || id === undefined || id === '') return null;
  const nuevo = mapa.get(Number(id));
  if (!nuevo) throw new ErrorCopia(mensaje);
  return nuevo;
}

export class CopiaMarcaRepositorio {
  async listarIds() {
    const [filas] = await pool.query('SELECT id FROM marcas ORDER BY id');
    return filas.map((fila) => Number(fila.id));
  }

  async exportar(marcaId) {
    const conexion = await pool.getConnection();
    try {
      await conexion.beginTransaction();
      await asegurarTablasConocidas(conexion);
      const [marcas] = await conexion.execute('SELECT * FROM marcas WHERE id = ? LIMIT 1', [marcaId]);
      if (!marcas.length) {
        await conexion.commit();
        return null;
      }

      const tablas = {};
      for (const tabla of TABLAS) {
        const [filas] = await conexion.execute(
          `SELECT * FROM ${citar(tabla)} WHERE marca_id = ?`,
          [marcaId]
        );
        tablas[tabla] = filas.map(serializarFila);
      }

      const [vinculos] = await conexion.execute(
        `SELECT p.publicidad_id, p.publicacion_id
         FROM publicidad_blog_publicacion p
         INNER JOIN publicaciones_blog b ON b.id = p.publicacion_id
         WHERE b.marca_id = ?`,
        [marcaId]
      );

      await conexion.commit();
      return {
        marca: serializarFila(marcas[0]),
        tablas,
        publicidadPublicacion: vinculos.map(serializarFila),
      };
    } catch (error) {
      await conexion.rollback();
      throw error;
    } finally {
      conexion.release();
    }
  }

  async idsExistentes(ids) {
    const limpios = [...new Set(ids.map(Number).filter((id) => Number.isInteger(id) && id > 0))];
    if (!limpios.length) return new Set();
    const marcas = limpios.map(() => '?').join(', ');
    const [filas] = await pool.execute(
      `SELECT id FROM marcas WHERE id IN (${marcas})`,
      limpios
    );
    return new Set(filas.map((fila) => Number(fila.id)));
  }

  async restaurar(documento, marcaIdForzada = null) {
    const conexion = await pool.getConnection();
    try {
      await conexion.beginTransaction();
      await asegurarTablasConocidas(conexion);

      const marcaCopia = documento.marca;
      const destino = await this.#resolverDestino(conexion, marcaCopia, marcaIdForzada);
      await this.#revisarChoques(conexion, documento, destino.id, destino.crear);

      if (destino.crear) {
        destino.id = await insertar(
          conexion,
          'marcas',
          await columnasDe(conexion, 'marcas'),
          marcaCopia,
          { slug: destino.slug }
        );
      } else {
        await this.#actualizarMarca(conexion, marcaCopia, destino.id, destino.slug);
      }

      await this.#borrarDatos(conexion, destino.id);
      const cuentas = await this.#insertarDatos(conexion, documento, destino.id);

      await conexion.commit();
      return {
        marcaId: destino.id,
        nombre: marcaCopia.nombre_comercial,
        slug: destino.slug,
        creada: destino.crear,
        ...cuentas,
      };
    } catch (error) {
      await conexion.rollback();
      if (error.esCopia) {
        return { error: error.message, codigoHttp: error.codigoHttp };
      }
      if (error.code === 'ER_DUP_ENTRY') {
        return {
          error: 'La copia choca con un dato de otra empresa. No se cambió nada.',
          codigoHttp: 409,
        };
      }
      throw error;
    } finally {
      conexion.release();
    }
  }

  async #resolverDestino(conexion, marcaCopia, marcaIdForzada) {
    const [porId] = await conexion.execute('SELECT id, slug FROM marcas WHERE id = ? LIMIT 1', [marcaCopia.id]);
    const [porSlug] = await conexion.execute('SELECT id, slug FROM marcas WHERE slug = ? LIMIT 1', [marcaCopia.slug]);
    const duenoSlug = porSlug[0] ?? null;

    if (marcaIdForzada) {
      const [forzada] = await conexion.execute(
        'SELECT id, slug FROM marcas WHERE id = ? LIMIT 1 FOR UPDATE',
        [marcaIdForzada]
      );
      if (!forzada.length) {
        throw new ErrorCopia('Marca no encontrada.', 404);
      }
      const actual = forzada[0];
      if (Number(actual.id) !== Number(marcaCopia.id)) {
        throw new ErrorCopia('Esta copia es de otra empresa. No se cambió nada.', 409);
      }
      const slug = duenoSlug && Number(duenoSlug.id) !== Number(actual.id) ? actual.slug : marcaCopia.slug;
      return { id: Number(actual.id), slug, crear: false };
    }

    if (porId.length) {
      const actual = porId[0];
      const slug = duenoSlug && Number(duenoSlug.id) !== Number(actual.id) ? actual.slug : marcaCopia.slug;
      return { id: Number(actual.id), slug, crear: false };
    }

    if (duenoSlug) {
      throw new ErrorCopia('Ese enlace ya lo usa otra empresa. No se cambió nada.', 409);
    }

    return { id: null, slug: marcaCopia.slug, crear: true };
  }

  async #revisarChoques(conexion, documento, marcaId, creando) {
    const correo = await conflictoUnico(
      conexion,
      'usuarios',
      'correo',
      filasDe(documento, 'usuarios').map((fila) => fila.correo),
      marcaId,
      creando,
      true
    );
    if (correo) {
      throw new ErrorCopia('Un correo de la copia ya pertenece a otra cuenta. No se cambió nada.', 409);
    }

    const codigo = await conflictoUnico(
      conexion,
      'citas',
      'codigo_confirmacion',
      filasDe(documento, 'citas').map((fila) => fila.codigo_confirmacion),
      marcaId,
      creando
    );
    if (codigo) {
      throw new ErrorCopia('Una cita de la copia usa un código de otra empresa. No se cambió nada.', 409);
    }

    const referencia = await conflictoUnico(
      conexion,
      'pagos_wompi',
      'referencia',
      filasDe(documento, 'pagos_wompi').map((fila) => fila.referencia),
      marcaId,
      creando
    );
    if (referencia) {
      throw new ErrorCopia('Un pago de la copia usa una referencia de otra empresa. No se cambió nada.', 409);
    }
  }

  async #actualizarMarca(conexion, marcaCopia, destinoId, slug) {
    const columnas = await columnasDe(conexion, 'marcas');
    const datos = {};
    for (const columna of columnas) {
      if (columna === 'id') continue;
      if (columna === 'slug') {
        datos.slug = slug;
        continue;
      }
      if (Object.prototype.hasOwnProperty.call(marcaCopia, columna)) {
        datos[columna] = marcaCopia[columna];
      }
    }
    const claves = Object.keys(datos);
    await conexion.execute(
      `UPDATE marcas SET ${claves.map((clave) => `${citar(clave)} = ?`).join(', ')} WHERE id = ?`,
      [...claves.map((clave) => preparar(datos[clave])), destinoId]
    );
  }

  async #borrarDatos(conexion, marcaId) {
    await conexion.execute(
      `DELETE p FROM publicidad_blog_publicacion p
       INNER JOIN publicaciones_blog b ON b.id = p.publicacion_id
       WHERE b.marca_id = ?`,
      [marcaId]
    );
    for (const tabla of BORRADO) {
      await conexion.execute(`DELETE FROM ${citar(tabla)} WHERE marca_id = ?`, [marcaId]);
    }
    await conexion.execute('DELETE FROM tokens_sesion WHERE marca_id = ?', [marcaId]);
    await conexion.execute(
      `DELETE FROM tokens_sesion WHERE usuario_id IN (SELECT id FROM usuarios WHERE marca_id = ?)`,
      [marcaId]
    );
    await conexion.execute(
      `DELETE FROM recuperaciones_contrasena WHERE usuario_id IN (SELECT id FROM usuarios WHERE marca_id = ?)`,
      [marcaId]
    );
    await conexion.execute('DELETE FROM usuarios WHERE marca_id = ?', [marcaId]);
  }

  async #insertarDatos(conexion, documento, destinoId) {
    const mapas = mapaVacio();
    const columnas = {};
    for (const tabla of TABLAS) {
      columnas[tabla] = await columnasDe(conexion, tabla);
    }

    const simple = [
      'configuraciones_marca',
      'estilistas',
      'profesionales',
      'clientes',
      'servicios',
      'publicaciones_blog',
      'galeria_catalogo',
      'carrusel_inicio',
      'historial_suscripciones_marca',
      'pagos_wompi',
    ];

    for (const tabla of simple) {
      for (const fila of filasDe(documento, tabla)) {
        const nuevoId = await insertar(conexion, tabla, columnas[tabla], fila, { marca_id: destinoId });
        if (mapas[tabla]) mapas[tabla].set(idPrevio(fila), nuevoId);
      }
    }

    for (const fila of filasDe(documento, 'usuarios')) {
      if (!ROLES_MARCA.has(fila.rol)) {
        throw new ErrorCopia('La copia trae un acceso que no es de esta empresa.');
      }
      await insertar(conexion, 'usuarios', columnas.usuarios, fila, {
        marca_id: destinoId,
        rol: fila.rol,
      });
    }

    for (const fila of filasDe(documento, 'disenos_galeria')) {
      const estilistaId = fila.estilista_id
        ? exigirMapa(mapas.estilistas, fila.estilista_id, 'La copia no trae a la profesional de una foto.')
        : null;
      const profesionalId = fila.profesional_id
        ? exigirMapa(mapas.profesionales, fila.profesional_id, 'La copia no trae a la profesional de una foto.')
        : null;
      const nuevoId = await insertar(conexion, 'disenos_galeria', columnas.disenos_galeria, fila, {
        marca_id: destinoId,
        estilista_id: estilistaId,
        profesional_id: profesionalId,
      });
      mapas.disenos_galeria.set(idPrevio(fila), nuevoId);
    }

    for (const fila of filasDe(documento, 'citas')) {
      const nuevoId = await insertar(conexion, 'citas', columnas.citas, fila, {
        marca_id: destinoId,
        cliente_id: exigirMapa(mapas.clientes, fila.cliente_id, 'La copia no trae a la clienta de una cita.'),
        servicio_id: exigirMapa(mapas.servicios, fila.servicio_id, 'La copia no trae el servicio de una cita.'),
        estilista_id: fila.estilista_id
          ? exigirMapa(mapas.estilistas, fila.estilista_id, 'La copia no trae a la profesional de una cita.')
          : null,
        profesional_id: fila.profesional_id
          ? exigirMapa(mapas.profesionales, fila.profesional_id, 'La copia no trae a la profesional de una cita.')
          : null,
      });
      mapas.citas.set(idPrevio(fila), nuevoId);
    }

    for (const fila of filasDe(documento, 'solicitudes_reagendamiento')) {
      await insertar(conexion, 'solicitudes_reagendamiento', columnas.solicitudes_reagendamiento, fila, {
        marca_id: destinoId,
        cita_id: exigirMapa(mapas.citas, fila.cita_id, 'La copia no trae la cita de un reagendamiento.'),
      });
    }

    for (const fila of filasDe(documento, 'cliente_favoritos')) {
      const mapa = fila.tipo === 'servicio' ? mapas.servicios : mapas.disenos_galeria;
      const referenciaId = mapa.get(Number(fila.referencia_id));
      const clienteId = mapas.clientes.get(Number(fila.cliente_id));
      if (!referenciaId || !clienteId) continue;
      await insertar(conexion, 'cliente_favoritos', columnas.cliente_favoritos, fila, {
        marca_id: destinoId,
        cliente_id: clienteId,
        referencia_id: referenciaId,
      });
    }

    for (const fila of filasDe(documento, 'cita_disenos_galeria')) {
      await insertar(conexion, 'cita_disenos_galeria', columnas.cita_disenos_galeria, fila, {
        marca_id: destinoId,
        cita_id: exigirMapa(mapas.citas, fila.cita_id, 'La copia no trae la cita de un diseño.'),
        diseno_id: exigirMapa(mapas.disenos_galeria, fila.diseno_id, 'La copia no trae la foto elegida en una cita.'),
      });
    }

    for (const fila of filasDe(documento, 'profesional_excepciones')) {
      await insertar(conexion, 'profesional_excepciones', columnas.profesional_excepciones, fila, {
        marca_id: destinoId,
        profesional_id: exigirMapa(mapas.profesionales, fila.profesional_id, 'La copia no trae a la profesional de un horario.'),
      });
    }

    for (const fila of filasDe(documento, 'selecciones_galeria_telefono')) {
      const disenoId = mapas.disenos_galeria.get(Number(fila.diseno_id));
      if (!disenoId) continue;
      await insertar(conexion, 'selecciones_galeria_telefono', columnas.selecciones_galeria_telefono, fila, {
        marca_id: destinoId,
        diseno_id: disenoId,
      });
    }

    for (const fila of filasDe(documento, 'notificaciones')) {
      let referenciaId = null;
      if (fila.referencia_tipo === 'cita') {
        referenciaId = mapas.citas.get(Number(fila.referencia_id)) ?? null;
      } else if (fila.referencia_tipo === 'suscripcion') {
        referenciaId = destinoId;
      }
      await insertar(conexion, 'notificaciones', columnas.notificaciones, fila, {
        marca_id: destinoId,
        referencia_id: referenciaId,
      });
    }

    const [anuncios] = await conexion.query('SELECT id FROM publicidad_blog');
    const anunciosVivos = new Set(anuncios.map((fila) => Number(fila.id)));
    for (const vinculo of documento.publicidadPublicacion ?? []) {
      const publicidadId = Number(vinculo.publicidad_id);
      const publicacionId = mapas.publicaciones_blog.get(Number(vinculo.publicacion_id));
      if (!anunciosVivos.has(publicidadId) || !publicacionId) continue;
      await conexion.execute(
        `INSERT INTO publicidad_blog_publicacion (publicidad_id, publicacion_id) VALUES (?, ?)`,
        [publicidadId, publicacionId]
      );
    }

    return {
      clientes: filasDe(documento, 'clientes').length,
      citas: filasDe(documento, 'citas').length,
    };
  }
}
