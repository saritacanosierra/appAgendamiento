export const PRECIO_MES_COP = 25000;

export const PLAN_TIPOS = {
  mensual: { meses: 1, etiqueta: 'Mensual', precio: 25000 },
  trimestral: { meses: 3, etiqueta: 'Trimestral', precio: 90000 },
  semestral: { meses: 6, etiqueta: 'Semestral', precio: 180000 },
  anual: { meses: 12, etiqueta: 'Anual', precio: 360000 },
};

export const TIPOS_PLAN_VALIDOS = Object.keys(PLAN_TIPOS);

export function hoyISO() {
  const hoy = new Date();
  return fechaLocalAISO(hoy);
}

function fechaLocalAISO(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function normalizarFechaISO(valor) {
  if (!valor) return null;

  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return fechaLocalAISO(valor);
  }

  const texto = String(valor).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
    return texto.slice(0, 10);
  }

  const comoFecha = new Date(texto);
  if (!Number.isNaN(comoFecha.getTime())) {
    return fechaLocalAISO(comoFecha);
  }

  return null;
}

export function parseFechaLocal(valor) {
  const iso = normalizarFechaISO(valor);
  if (!iso) return null;

  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatearFechaISO(date) {
  return date.toISOString().slice(0, 10);
}

export function sumarDiasISO(fechaInicio, dias) {
  const inicio = parseFechaLocal(fechaInicio);
  if (!inicio) return null;
  const vence = new Date(inicio);
  vence.setUTCDate(vence.getUTCDate() + dias);
  return formatearFechaISO(vence);
}

export function calcularVencimiento(fechaInicio, planTipo) {
  const inicio = parseFechaLocal(fechaInicio);
  const meses = PLAN_TIPOS[planTipo]?.meses ?? 1;
  const vence = new Date(inicio);
  vence.setUTCMonth(vence.getUTCMonth() + meses);
  return formatearFechaISO(vence);
}

export function diasEntre(desde, hasta) {
  const a = parseFechaLocal(desde);
  const b = parseFechaLocal(hasta);
  if (!a || !b) return null;
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}

export function planEstaVencido(marca) {
  if (!marca?.plan_vence_en) return false;
  return diasEntre(hoyISO(), marca.plan_vence_en) < 0;
}

export function diasRestantesPlan(marca) {
  if (!marca?.plan_vence_en) return null;
  const dias = diasEntre(hoyISO(), marca.plan_vence_en);
  if (dias == null) return null;
  return Math.max(0, dias);
}

export function diasDesdeFacturacion(marca) {
  const ref = marca?.plan_ultima_facturacion_en ?? marca?.plan_inicio_en;
  if (!ref) return null;
  return diasEntre(ref, hoyISO());
}

export function etiquetaPlanTipo(tipo) {
  return PLAN_TIPOS[tipo]?.etiqueta ?? tipo ?? '—';
}

export function precioPlanCop(planTipo) {
  return PLAN_TIPOS[planTipo]?.precio ?? null;
}

export function listarPlanesCobro() {
  return TIPOS_PLAN_VALIDOS.map((tipo) => ({
    tipo,
    etiqueta: PLAN_TIPOS[tipo].etiqueta,
    meses: PLAN_TIPOS[tipo].meses,
    precio: precioPlanCop(tipo),
  }));
}

export function mapearEstadoSuscripcion(fila) {
  if (!fila) return null;

  const diasRestantes = diasRestantesPlan(fila);
  const vencido = planEstaVencido(fila);
  const tieneVigencia = Boolean(fila.plan_vence_en);

  return {
    tipo: fila.plan_tipo ?? null,
    tipoEtiqueta: etiquetaPlanTipo(fila.plan_tipo),
    inicioEn: normalizarFechaISO(fila.plan_inicio_en),
    venceEn: normalizarFechaISO(fila.plan_vence_en),
    monto: fila.plan_monto != null ? Number(fila.plan_monto) : null,
    ultimaFacturacionEn: normalizarFechaISO(fila.plan_ultima_facturacion_en),
    diasDesdeFacturacion: diasDesdeFacturacion(fila),
    diasRestantes,
    vencido,
    porVencer: tieneVigencia && !vencido && diasRestantes != null && diasRestantes <= 7,
    vigente: tieneVigencia && !vencido && Boolean(fila.plan_habilitado),
    configurado: tieneVigencia && Boolean(fila.plan_tipo),
    prueba: esPeriodoDePrueba(fila),
  };
}

function esPeriodoDePrueba(fila) {
  if (!fila?.plan_inicio_en || !fila?.plan_vence_en || fila.plan_ultima_facturacion_en) return false;
  const dias = diasEntre(fila.plan_inicio_en, fila.plan_vence_en);
  return dias != null && dias > 0 && dias <= 8;
}

export function resolverDiasAvisoSuscripcion() {
  const raw = process.env.SUSCRIPCION_DIAS_AVISO ?? '7,3,1';
  return raw
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => b - a);
}
