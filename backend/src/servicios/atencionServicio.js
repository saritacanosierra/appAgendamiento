import { pool } from '../configuracion/baseDatos.js';
import { ReservaRepositorio } from '../repositorios/index.js';
import { mapearCitaAdmin } from '../utilidades/mapeadorCitas.js';
import { esFechaValida } from '../utilidades/fechaHora.js';
import { entero, texto } from '../utilidades/sanitizador.js';

function monto(valor) {
  if (valor === null || valor === undefined || valor === '') return 0;
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
}

function mapearCitaAtencion(fila) {
  const cita = mapearCitaAdmin(fila);
  if (!cita) return null;

  let extras = [];
  if (fila.extras_json) {
    try {
      extras = typeof fila.extras_json === 'string' ? JSON.parse(fila.extras_json) : fila.extras_json;
    } catch {
      extras = [];
    }
  }

  return {
    ...cita,
    facturacion: {
      precioBase: fila.precio_base != null ? Number(fila.precio_base) : null,
      precioAdicional: Number(fila.precio_adicional ?? 0),
      precioFinal: fila.precio_final != null ? Number(fila.precio_final) : null,
      duracionRealMinutos: fila.duracion_real_minutos != null ? Number(fila.duracion_real_minutos) : null,
      extras,
      confirmadaPrestacion: Boolean(fila.confirmada_prestacion),
      cerradaAt: fila.cerrada_at ?? null,
    },
  };
}

function normalizarExtras(extrasRaw) {
  if (!Array.isArray(extrasRaw)) return [];

  return extrasRaw
    .map((item) => ({
      concepto: texto(item?.concepto ?? item?.descripcion)?.trim(),
      monto: monto(item?.monto),
    }))
    .filter((item) => item.concepto && item.monto > 0);
}

export class AtencionServicio {
  constructor(deps = {}) {
    this.citaRepo = deps.citaRepo ?? new ReservaRepositorio();
  }

  async listarCitasAtencion(marcaId, fecha) {
    const fechaFinal = fecha || new Date().toISOString().slice(0, 10);

    if (!esFechaValida(fechaFinal)) {
      return { error: 'Fecha invalida.', codigoHttp: 422 };
    }

    const filas = await this.citaRepo.listarParaAtencion(marcaId, fechaFinal);
    const citas = filas.map(mapearCitaAtencion);

    const pendientes = citas.filter((c) => ['pendiente', 'confirmada'].includes(c.estado));
    const atendidas = citas.filter((c) => c.estado === 'completada' && c.facturacion.confirmadaPrestacion);

    return {
      fecha: fechaFinal,
      pendientes,
      atendidas,
      resumen: {
        pendientes: pendientes.length,
        atendidas: atendidas.length,
        ingresoAtendido: atendidas.reduce(
          (sum, c) => sum + (c.facturacion.precioFinal ?? c.servicio.precio ?? 0),
          0
        ),
      },
    };
  }

  async cerrarServicio(marcaId, citaId, datos) {
    const cita = await this.citaRepo.buscarPorId(marcaId, citaId);

    if (!cita) {
      return { error: 'Cita no encontrada.', codigoHttp: 404 };
    }

    if (!['pendiente', 'confirmada'].includes(cita.estado)) {
      return { error: 'Esta cita ya fue cerrada o cancelada.', codigoHttp: 409 };
    }

    const duracionMinutos = entero(datos.duracion_minutos ?? datos.duracionMinutos);
    if (!duracionMinutos || duracionMinutos < 1) {
      return { error: 'Indica la duracion real del servicio (minimo 1 minuto).', codigoHttp: 422 };
    }

    if (duracionMinutos > 480) {
      return { error: 'La duracion maxima permitida es de 480 minutos.', codigoHttp: 422 };
    }

    const extras = normalizarExtras(datos.extras);
    const precioAdicional = extras.reduce((sum, e) => sum + e.monto, 0);
    const precioBase = Number(cita.precio);
    const precioFinal = precioBase + precioAdicional;
    const notasInternas = texto(datos.notas_internas ?? datos.notasInternas) || null;

    const conexion = await pool.getConnection();
    try {
      await conexion.beginTransaction();

      const actualizado = await this.citaRepo.cerrarServicio(conexion, marcaId, citaId, {
        precioBase,
        precioAdicional,
        precioFinal,
        duracionRealMinutos: duracionMinutos,
        extrasJson: extras.length > 0 ? JSON.stringify(extras) : null,
        notasInternas,
      });

      if (!actualizado) {
        await conexion.rollback();
        return { error: 'No se pudo cerrar la cita.', codigoHttp: 409 };
      }

      await conexion.commit();

      const fila = await this.citaRepo.buscarPorId(marcaId, citaId);
      return { cita: mapearCitaAtencion(fila) };
    } catch (err) {
      await conexion.rollback();
      throw err;
    } finally {
      conexion.release();
    }
  }
}

export const atencionServicio = new AtencionServicio();
