import { pool } from '../configuracion/baseDatos.js';
import { PUNTOS_POR_SERVICIO_COMPLETADO } from './clienteFavoritosRepositorio.js';

const CREAR_TABLA = `
CREATE TABLE IF NOT EXISTS premios_puntos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  marca_id INT UNSIGNED NOT NULL,
  cliente_id INT UNSIGNED NOT NULL,
  cita_id INT UNSIGNED NULL,
  puntos_usados INT UNSIGNED NOT NULL,
  porcentaje TINYINT UNSIGNED NOT NULL,
  estado ENUM('pendiente', 'entregado') NOT NULL DEFAULT 'pendiente',
  pendiente_cliente INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  entregado_en TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY uq_premio_pendiente_cliente (pendiente_cliente),
  KEY idx_premios_marca_cliente (marca_id, cliente_id, estado),
  KEY idx_premios_cita (cita_id),
  CONSTRAINT fk_premios_puntos_marca FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE CASCADE,
  CONSTRAINT fk_premios_puntos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  CONSTRAINT fk_premios_puntos_cita FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

let tablaLista = null;

export async function asegurarTablaPremios() {
  if (!tablaLista) {
    tablaLista = pool.query(CREAR_TABLA).catch((error) => {
      tablaLista = null;
      throw error;
    });
  }
  return tablaLista;
}

function mapearPendiente(fila) {
  if (!fila) return null;
  return {
    id: Number(fila.id),
    citaId: fila.cita_id != null ? Number(fila.cita_id) : null,
    puntosUsados: Number(fila.puntos_usados),
    porcentaje: Number(fila.porcentaje),
  };
}

export class PremioPuntosRepositorio {
  async contarCompletados(conexion, marcaId, clienteId) {
    const [filas] = await conexion.execute(
      `SELECT COUNT(*) AS total FROM citas
       WHERE marca_id = ? AND cliente_id = ?
         AND estado = 'completada' AND confirmada_prestacion = 1`,
      [marcaId, clienteId]
    );
    return Number(filas[0]?.total ?? 0);
  }

  async sumarCanjeados(conexion, marcaId, clienteId) {
    const [filas] = await conexion.execute(
      `SELECT COALESCE(SUM(puntos_usados), 0) AS total
       FROM premios_puntos
       WHERE marca_id = ? AND cliente_id = ? AND estado = 'entregado'`,
      [marcaId, clienteId]
    );
    return Number(filas[0]?.total ?? 0);
  }

  async buscarPendiente(marcaId, clienteId, conexion = pool) {
    const [filas] = await conexion.execute(
      `SELECT id, cita_id, puntos_usados, porcentaje
       FROM premios_puntos
       WHERE marca_id = ? AND cliente_id = ? AND estado = 'pendiente'
       LIMIT 1`,
      [marcaId, clienteId]
    );
    return mapearPendiente(filas[0]);
  }

  async buscarPorCita(marcaId, citaId) {
    const [filas] = await pool.execute(
      `SELECT id, cita_id, puntos_usados, porcentaje, estado
       FROM premios_puntos
       WHERE marca_id = ? AND cita_id = ?
       LIMIT 1`,
      [marcaId, citaId]
    );
    const fila = filas[0];
    if (!fila) return null;
    return {
      ...mapearPendiente(fila),
      estado: fila.estado,
    };
  }

  async resumenesMarca(marcaId) {
    await asegurarTablaPremios();
    const [completados] = await pool.execute(
      `SELECT cliente_id, COUNT(*) AS total
       FROM citas
       WHERE marca_id = ? AND estado = 'completada' AND confirmada_prestacion = 1
       GROUP BY cliente_id`,
      [marcaId]
    );
    const [premios] = await pool.execute(
      `SELECT cliente_id,
              SUM(CASE WHEN estado = 'entregado' THEN puntos_usados ELSE 0 END) AS canjeados,
              MAX(CASE WHEN estado = 'pendiente' THEN id END) AS pendiente_id,
              MAX(CASE WHEN estado = 'pendiente' THEN cita_id END) AS pendiente_cita_id,
              MAX(CASE WHEN estado = 'pendiente' THEN puntos_usados END) AS pendiente_puntos,
              MAX(CASE WHEN estado = 'pendiente' THEN porcentaje END) AS pendiente_porcentaje
       FROM premios_puntos
       WHERE marca_id = ?
       GROUP BY cliente_id`,
      [marcaId]
    );
    const porCliente = new Map();
    for (const fila of completados) {
      porCliente.set(Number(fila.cliente_id), {
        completados: Number(fila.total),
        canjeados: 0,
        pendiente: null,
      });
    }
    for (const fila of premios) {
      const id = Number(fila.cliente_id);
      const actual = porCliente.get(id) ?? { completados: 0, canjeados: 0, pendiente: null };
      actual.canjeados = Number(fila.canjeados ?? 0);
      actual.pendiente = fila.pendiente_id
        ? {
          id: Number(fila.pendiente_id),
          citaId: fila.pendiente_cita_id != null ? Number(fila.pendiente_cita_id) : null,
          puntosUsados: Number(fila.pendiente_puntos),
          porcentaje: Number(fila.pendiente_porcentaje),
        }
        : null;
      porCliente.set(id, actual);
    }
    return porCliente;
  }

  async reservar(marcaId, clienteId, citaId, puntosUsados, porcentaje) {
    const conexion = await pool.getConnection();
    try {
      await conexion.beginTransaction();
      const [ya] = await conexion.execute(
        `SELECT id FROM premios_puntos
         WHERE marca_id = ? AND cliente_id = ? AND estado = 'pendiente'
         LIMIT 1 FOR UPDATE`,
        [marcaId, clienteId]
      );
      if (ya[0]) {
        await conexion.rollback();
        return null;
      }
      const completados = await this.contarCompletados(conexion, marcaId, clienteId);
      const canjeados = await this.sumarCanjeados(conexion, marcaId, clienteId);
      const disponibles = completados * PUNTOS_POR_SERVICIO_COMPLETADO - canjeados;
      if (disponibles < puntosUsados) {
        await conexion.rollback();
        return null;
      }
      const [resultado] = await conexion.execute(
        `INSERT INTO premios_puntos
          (marca_id, cliente_id, cita_id, puntos_usados, porcentaje, estado, pendiente_cliente)
         VALUES (?, ?, ?, ?, ?, 'pendiente', ?)`,
        [marcaId, clienteId, citaId, puntosUsados, porcentaje, clienteId]
      );
      await conexion.commit();
      return {
        id: resultado.insertId,
        citaId,
        puntosUsados,
        porcentaje,
      };
    } catch (error) {
      await conexion.rollback();
      if (error?.code === 'ER_DUP_ENTRY') return null;
      throw error;
    } finally {
      conexion.release();
    }
  }

  async liberarCita(marcaId, citaId) {
    await asegurarTablaPremios();
    await pool.execute(
      `DELETE FROM premios_puntos
       WHERE marca_id = ? AND cita_id = ? AND estado = 'pendiente'`,
      [marcaId, citaId]
    );
  }

  async entregar(marcaId, clienteId, config) {
    const conexion = await pool.getConnection();
    try {
      await conexion.beginTransaction();
      const [pendientes] = await conexion.execute(
        `SELECT id FROM premios_puntos
         WHERE marca_id = ? AND cliente_id = ? AND estado = 'pendiente'
         LIMIT 1 FOR UPDATE`,
        [marcaId, clienteId]
      );
      if (pendientes[0]) {
        await conexion.execute(
          `UPDATE premios_puntos
           SET estado = 'entregado', pendiente_cliente = NULL, entregado_en = NOW()
           WHERE id = ? AND marca_id = ?`,
          [pendientes[0].id, marcaId]
        );
      } else {
        const completados = await this.contarCompletados(conexion, marcaId, clienteId);
        const canjeados = await this.sumarCanjeados(conexion, marcaId, clienteId);
        const disponibles = completados * PUNTOS_POR_SERVICIO_COMPLETADO - canjeados;
        if (disponibles < config.puntosNecesarios) {
          await conexion.rollback();
          return { error: 'Aún no llega a los puntos del premio.', codigoHttp: 409 };
        }
        await conexion.execute(
          `INSERT INTO premios_puntos
            (marca_id, cliente_id, cita_id, puntos_usados, porcentaje, estado, pendiente_cliente, entregado_en)
           VALUES (?, ?, NULL, ?, ?, 'entregado', NULL, NOW())`,
          [marcaId, clienteId, config.puntosNecesarios, config.porcentaje]
        );
      }
      await conexion.commit();
      return { ok: true };
    } catch (error) {
      await conexion.rollback();
      throw error;
    } finally {
      conexion.release();
    }
  }
}

export const premioPuntosRepositorio = new PremioPuntosRepositorio();
