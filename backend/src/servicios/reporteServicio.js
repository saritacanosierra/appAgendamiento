import { ReporteRepositorio } from '../repositorios/reporteRepositorio.js';
import { ReservaRepositorio } from '../repositorios/index.js';
import { esFechaValida } from '../utilidades/fechaHora.js';

const MAX_DIAS_RANGO = 366;

function inicioMesActual() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-01`;
}

function finMesActual() {
  const hoy = new Date();
  const ultimo = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  return ultimo.toISOString().slice(0, 10);
}

function normalizarFechaSql(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  return String(valor).slice(0, 10);
}

export class ReporteServicio {
  constructor(deps = {}) {
    this.repo = deps.repo ?? new ReporteRepositorio();
    this.citaRepo = deps.citaRepo ?? new ReservaRepositorio();
  }

  async obtenerReporte(marcaId, desde, hasta) {
    const desdeFinal = desde || inicioMesActual();
    const hastaFinal = hasta || finMesActual();

    if (!esFechaValida(desdeFinal) || !esFechaValida(hastaFinal)) {
      return { error: 'Rango de fechas invalido.', codigoHttp: 422 };
    }

    if (desdeFinal > hastaFinal) {
      return { error: 'La fecha inicial no puede ser posterior a la final.', codigoHttp: 422 };
    }

    const diffDias =
      (new Date(hastaFinal).getTime() - new Date(desdeFinal).getTime()) / (1000 * 60 * 60 * 24) + 1;

    if (diffDias > MAX_DIAS_RANGO) {
      return { error: `El rango maximo es de ${MAX_DIAS_RANGO} dias.`, codigoHttp: 422 };
    }

    await this.citaRepo.marcarPasadasComoCompletadas(marcaId);

    const [porEstado, clientesNuevas, porDia, populares, rendimiento] = await Promise.all([
      this.repo.resumenCitasPorEstado(marcaId, desdeFinal, hastaFinal),
      this.repo.contarClientesNuevas(marcaId, desdeFinal, hastaFinal),
      this.repo.citasPorDia(marcaId, desdeFinal, hastaFinal),
      this.repo.serviciosPopulares(marcaId, desdeFinal, hastaFinal),
      this.repo.rendimientoAtencion(marcaId, desdeFinal, hastaFinal),
    ]);

    const porEstadoMap = { pendiente: 0, confirmada: 0, cancelada: 0, completada: 0 };
    let ingresoEstimado = 0;
    let ingresoRealizado = 0;

    for (const fila of porEstado) {
      const total = Number(fila.total);
      const ingreso = Number(fila.ingreso);
      if (porEstadoMap[fila.estado] !== undefined) {
        porEstadoMap[fila.estado] = total;
      }
      if (['pendiente', 'confirmada'].includes(fila.estado)) {
        ingresoEstimado += ingreso;
      }
      if (fila.estado === 'completada') {
        ingresoRealizado += ingreso;
      }
    }

    const totalCitas = Object.values(porEstadoMap).reduce((a, b) => a + b, 0);

    return {
      periodo: { desde: desdeFinal, hasta: hastaFinal },
      citas: {
        total: totalCitas,
        porEstado: porEstadoMap,
        activas: totalCitas - porEstadoMap.cancelada,
      },
      ingresos: {
        estimado: ingresoEstimado,
        realizado: ingresoRealizado,
        moneda: 'COP',
      },
      clientesNuevas,
      citasPorDia: porDia.map((f) => ({
        fecha: normalizarFechaSql(f.fecha),
        total: Number(f.total),
        ingreso: Number(f.ingreso),
      })),
      serviciosPopulares: populares.map((f) => ({
        nombre: f.nombre,
        citas: Number(f.citas),
        ingreso: Number(f.ingreso),
      })),
      rendimiento: {
        serviciosConfirmados: Number(rendimiento.servicios_confirmados ?? 0),
        ingresoBase: Number(rendimiento.ingreso_base ?? 0),
        ingresoAdicional: Number(rendimiento.ingreso_adicional ?? 0),
        ingresoTotal: Number(rendimiento.ingreso_total ?? 0),
        duracionPromedioMin: Math.round(Number(rendimiento.duracion_promedio_min ?? 0)),
      },
    };
  }

  async obtenerReportePlataforma(desde, hasta) {
    const desdeFinal = desde || inicioMesActual();
    const hastaFinal = hasta || finMesActual();

    if (!esFechaValida(desdeFinal) || !esFechaValida(hastaFinal)) {
      return { error: 'Rango de fechas invalido.', codigoHttp: 422 };
    }

    if (desdeFinal > hastaFinal) {
      return { error: 'La fecha inicial no puede ser posterior a la final.', codigoHttp: 422 };
    }

    const diffDias =
      (new Date(hastaFinal).getTime() - new Date(desdeFinal).getTime()) / (1000 * 60 * 60 * 24) + 1;

    if (diffDias > MAX_DIAS_RANGO) {
      return { error: `El rango maximo es de ${MAX_DIAS_RANGO} dias.`, codigoHttp: 422 };
    }

    await this.citaRepo.marcarPasadasComoCompletadas();

    const [porEstado, clientesNuevas, porDia, porMarca] = await Promise.all([
      this.repo.resumenCitasPorEstadoPlataforma(desdeFinal, hastaFinal),
      this.repo.contarClientesNuevasPlataforma(desdeFinal, hastaFinal),
      this.repo.citasPorDiaPlataforma(desdeFinal, hastaFinal),
      this.repo.resumenPorMarca(desdeFinal, hastaFinal),
    ]);

    const porEstadoMap = { pendiente: 0, confirmada: 0, cancelada: 0, completada: 0 };
    let ingresoEstimado = 0;
    let ingresoRealizado = 0;

    for (const fila of porEstado) {
      const total = Number(fila.total);
      const ingreso = Number(fila.ingreso);
      if (porEstadoMap[fila.estado] !== undefined) {
        porEstadoMap[fila.estado] = total;
      }
      if (['pendiente', 'confirmada'].includes(fila.estado)) {
        ingresoEstimado += ingreso;
      }
      if (fila.estado === 'completada') {
        ingresoRealizado += ingreso;
      }
    }

    const totalCitas = Object.values(porEstadoMap).reduce((a, b) => a + b, 0);

    return {
      periodo: { desde: desdeFinal, hasta: hastaFinal },
      citas: {
        total: totalCitas,
        porEstado: porEstadoMap,
        activas: totalCitas - porEstadoMap.cancelada,
      },
      ingresos: {
        estimado: ingresoEstimado,
        realizado: ingresoRealizado,
        moneda: 'COP',
      },
      clientesNuevas,
      citasPorDia: porDia.map((f) => ({
        fecha: normalizarFechaSql(f.fecha),
        total: Number(f.total),
        ingreso: Number(f.ingreso),
      })),
      porMarca: porMarca.map((f) => ({
        id: f.id,
        nombreComercial: f.nombre_comercial,
        slug: f.slug,
        citas: Number(f.citas),
        ingreso: Number(f.ingreso),
      })),
    };
  }
}

export const reporteServicio = new ReporteServicio();
