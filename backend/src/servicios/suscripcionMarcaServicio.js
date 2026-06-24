import { MarcaPlataformaRepositorio } from '../repositorios/plataformaRepositorio.js';
import { SuscripcionMarcaRepositorio } from '../repositorios/suscripcionMarcaRepositorio.js';
import { notificacionServicio } from './notificacionServicio.js';
import {
  TIPOS_PLAN_VALIDOS,
  calcularVencimiento,
  diasRestantesPlan,
  hoyISO,
  mapearEstadoSuscripcion,
  planEstaVencido,
  resolverDiasAvisoSuscripcion,
} from '../utilidades/suscripcionMarca.js';
import { texto } from '../utilidades/sanitizador.js';

function mapearHistorial(fila) {
  return {
    id: fila.id,
    planTipo: fila.plan_tipo,
    monto: fila.monto != null ? Number(fila.monto) : null,
    inicioEn: fila.inicio_en,
    venceEn: fila.vence_en,
    accion: fila.accion,
    createdAt: fila.created_at,
  };
}

export class SuscripcionMarcaServicio {
  constructor(deps = {}) {
    this.marcaRepo = deps.marcaRepo ?? new MarcaPlataformaRepositorio();
    this.suscripcionRepo = deps.suscripcionRepo ?? new SuscripcionMarcaRepositorio();
    this.notificaciones = deps.notificaciones ?? notificacionServicio;
  }

  validarTipoPlan(planTipo) {
    const tipo = texto(planTipo);
    if (!TIPOS_PLAN_VALIDOS.includes(tipo)) {
      return { error: 'Tipo de plan invalido.', codigoHttp: 422 };
    }
    return { tipo };
  }

  async activarPlan(marcaId, datosEntrada = {}) {
    const marca = await this.marcaRepo.buscarPorId(marcaId);
    if (!marca) return { error: 'Marca no encontrada.', codigoHttp: 404 };

    const tipoOk = this.validarTipoPlan(datosEntrada.plan_tipo ?? datosEntrada.planTipo ?? 'mensual');
    if (tipoOk.error) return tipoOk;

    const inicioEn = texto(datosEntrada.inicio_en ?? datosEntrada.inicioEn) || hoyISO();
    const montoRaw = datosEntrada.monto ?? datosEntrada.plan_monto;
    const monto = montoRaw != null && montoRaw !== '' ? Number(montoRaw) : null;
    const venceEn = calcularVencimiento(inicioEn, tipoOk.tipo);

    await this.suscripcionRepo.actualizarPlan(marcaId, {
      planTipo: tipoOk.tipo,
      inicioEn,
      venceEn,
      monto,
      ultimaFacturacionEn: inicioEn,
      planHabilitado: true,
    });

    await this.suscripcionRepo.registrarHistorial({
      marcaId,
      planTipo: tipoOk.tipo,
      monto,
      inicioEn,
      venceEn,
      accion: 'activacion',
    });

    const fila = await this.marcaRepo.buscarPorId(marcaId);
    return {
      mensaje: 'Plan activado correctamente.',
      marca: fila,
      suscripcion: mapearEstadoSuscripcion(fila),
    };
  }

  async renovarPlan(marcaId, datosEntrada = {}) {
    const marca = await this.marcaRepo.buscarPorId(marcaId);
    if (!marca) return { error: 'Marca no encontrada.', codigoHttp: 404 };

    const tipoOk = this.validarTipoPlan(
      datosEntrada.plan_tipo ?? datosEntrada.planTipo ?? marca.plan_tipo ?? 'mensual'
    );
    if (tipoOk.error) return tipoOk;

    const hoy = hoyISO();
    const baseInicio = marca.plan_vence_en && !planEstaVencido(marca)
      ? marca.plan_vence_en
      : hoy;
    const inicioEn = baseInicio > hoy ? baseInicio : hoy;
    const montoRaw = datosEntrada.monto ?? datosEntrada.plan_monto ?? marca.plan_monto;
    const monto = montoRaw != null && montoRaw !== '' ? Number(montoRaw) : null;
    const venceEn = calcularVencimiento(inicioEn, tipoOk.tipo);

    await this.suscripcionRepo.actualizarPlan(marcaId, {
      planTipo: tipoOk.tipo,
      inicioEn: marca.plan_inicio_en ?? inicioEn,
      venceEn,
      monto,
      ultimaFacturacionEn: hoy,
      planHabilitado: true,
    });

    await this.suscripcionRepo.registrarHistorial({
      marcaId,
      planTipo: tipoOk.tipo,
      monto,
      inicioEn: hoy,
      venceEn,
      accion: 'renovacion',
    });

    const fila = await this.marcaRepo.buscarPorId(marcaId);
    return {
      mensaje: 'Plan renovado correctamente.',
      marca: fila,
      suscripcion: mapearEstadoSuscripcion(fila),
    };
  }

  async listarHistorial(marcaId) {
    const filas = await this.suscripcionRepo.listarHistorial(marcaId);
    return filas.map(mapearHistorial);
  }

  async procesarCicloDiario() {
    const marcas = await this.suscripcionRepo.listarMarcasConVigencia();
    const diasAviso = resolverDiasAvisoSuscripcion();
    let vencidas = 0;
    let avisos = 0;

    for (const marca of marcas) {
      const diasRestantes = diasRestantesPlan(marca);

      if (planEstaVencido(marca)) {
        if (!marca.plan_aviso_vencido_en) {
          await this.suscripcionRepo.marcarAvisoVencidoEnviado(marca.id);
          await this.notificaciones.registrarPlanVencido({
            marcaId: marca.id,
            venceEn: marca.plan_vence_en,
          });
          vencidas += 1;
        } else if (marca.plan_habilitado) {
          await this.suscripcionRepo.marcarPlanVencido(marca.id);
        }
        continue;
      }

      if (diasRestantes == null) continue;

      for (const dias of diasAviso) {
        if (diasRestantes !== dias) continue;
        const yaEnviado = await this.suscripcionRepo.avisoYaEnviado(marca, dias);
        if (yaEnviado) continue;

        await this.suscripcionRepo.registrarAvisoEnviado(marca.id, dias);
        await this.notificaciones.registrarPlanPorVencer({
          marcaId: marca.id,
          diasRestantes: dias,
          venceEn: marca.plan_vence_en,
        });
        avisos += 1;
      }
    }

    return { vencidas, avisos, revisadas: marcas.length };
  }
}

export const suscripcionMarcaServicio = new SuscripcionMarcaServicio();
