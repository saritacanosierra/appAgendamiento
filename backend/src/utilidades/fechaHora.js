export function ahora() {
  return new Date();
}

export function formatear(fecha, opciones = {}) {
  if (!fecha) return null;
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(d.getTime())) return null;

  if (opciones.soloFecha) {
    return d.toISOString().slice(0, 10);
  }

  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function esFechaValida(fecha) {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && !Number.isNaN(new Date(fecha).getTime());
}

export function esHoraValida(hora) {
  return /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.test(hora);
}
