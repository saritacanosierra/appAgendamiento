function parseFechaCalendario(valor) {
  if (!valor) return null;

  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
  }

  const texto = String(valor).trim();
  const iso = /^\d{4}-\d{2}-\d{2}/.test(texto) ? texto.slice(0, 10) : null;
  if (iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  const fecha = new Date(texto);
  if (Number.isNaN(fecha.getTime())) return null;
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function hoyLocal() {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
}

function diasEntreCalendario(desde, hasta) {
  const a = parseFechaCalendario(desde);
  const b = parseFechaCalendario(hasta);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function estaSuscripcionVencida(suscripcion) {
  if (suscripcion?.vencido) return true;
  if (!suscripcion?.venceEn) return false;
  const dias = diasEntreCalendario(hoyLocal(), suscripcion.venceEn);
  return dias != null && dias < 0;
}

export function obtenerDiasRestantes(suscripcion) {
  if (!suscripcion?.venceEn) return null;
  if (typeof suscripcion.diasRestantes === 'number') {
    return Math.max(0, suscripcion.diasRestantes);
  }
  const dias = diasEntreCalendario(hoyLocal(), suscripcion.venceEn);
  if (dias == null) return null;
  return Math.max(0, dias);
}

export function obtenerDiasDesdeFacturacion(suscripcion) {
  if (typeof suscripcion?.diasDesdeFacturacion === 'number') {
    return suscripcion.diasDesdeFacturacion;
  }
  const ref = suscripcion?.ultimaFacturacionEn ?? suscripcion?.inicioEn;
  if (!ref) return null;
  return diasEntreCalendario(ref, hoyLocal());
}

export function textoDiasParaVencer(suscripcion) {
  if (!suscripcion?.venceEn) return null;
  if (estaSuscripcionVencida(suscripcion)) return 'El plan ya vencio';

  const dias = obtenerDiasRestantes(suscripcion);
  if (dias == null) return null;
  if (dias === 0) return 'Vence hoy';
  if (dias === 1) return 'Falta 1 dia para vencer';
  return `Faltan ${dias} dias para vencer`;
}

export function textoDiasDesdeFacturacion(suscripcion) {
  const dias = obtenerDiasDesdeFacturacion(suscripcion);
  if (dias == null) return null;
  if (dias === 0) return 'Hoy';
  if (dias === 1) return '1 dia';
  return `${dias} dias`;
}
