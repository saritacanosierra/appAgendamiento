export function fechaHoyLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fechaAString(anio, mesIndex0, dia) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${anio}-${pad(mesIndex0 + 1)}-${pad(dia)}`;
}

export function parseFechaLocal(str) {
  if (!str) return null;
  const [anio, mes, dia] = str.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

export const DIAS_SEMANA_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const MESES_ANIO = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** Genera celdas para un mes (incluye dias de relleno del mes anterior/siguiente). */
export function generarCeldasCalendario(anio, mesIndex0) {
  const hoy = fechaHoyLocal();
  const offsetLunes = (new Date(anio, mesIndex0, 1).getDay() + 6) % 7;
  const diasEnMes = new Date(anio, mesIndex0 + 1, 0).getDate();
  const mesPrev = mesIndex0 === 0 ? 11 : mesIndex0 - 1;
  const anioPrev = mesIndex0 === 0 ? anio - 1 : anio;
  const diasMesPrev = new Date(anioPrev, mesPrev + 1, 0).getDate();

  const celdas = [];

  for (let i = 0; i < offsetLunes; i += 1) {
    const dia = diasMesPrev - offsetLunes + i + 1;
    const fecha = fechaAString(anioPrev, mesPrev, dia);
    celdas.push({ fecha, dia, delMesActual: false, esHoy: fecha === hoy });
  }

  for (let dia = 1; dia <= diasEnMes; dia += 1) {
    const fecha = fechaAString(anio, mesIndex0, dia);
    celdas.push({ fecha, dia, delMesActual: true, esHoy: fecha === hoy });
  }

  let diaSig = 1;
  const mesSig = mesIndex0 === 11 ? 0 : mesIndex0 + 1;
  const anioSig = mesIndex0 === 11 ? anio + 1 : anio;
  while (celdas.length % 7 !== 0) {
    const fecha = fechaAString(anioSig, mesSig, diaSig);
    celdas.push({ fecha, dia: diaSig, delMesActual: false, esHoy: fecha === hoy });
    diaSig += 1;
  }

  return celdas;
}

export function formatearFechaLegible(str) {
  const fecha = parseFechaLocal(str);
  if (!fecha) return '';
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(fecha);
}

export function sumarDias(fechaStr, dias) {
  const d = parseFechaLocal(fechaStr);
  if (!d) return fechaStr;
  d.setDate(d.getDate() + dias);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Lista de dias consecutivos desde una fecha (para franja de seleccion). */
export function generarRangoDias(inicioStr, cantidad) {
  const hoy = fechaHoyLocal();
  const dias = [];
  for (let i = 0; i < cantidad; i += 1) {
    const fecha = sumarDias(inicioStr, i);
    const d = parseFechaLocal(fecha);
    dias.push({
      fecha,
      esHoy: fecha === hoy,
      diaSemana: new Intl.DateTimeFormat('es-MX', { weekday: 'short' }).format(d).replace('.', ''),
      numero: d.getDate(),
    });
  }
  return dias;
}

export function formatearHoraLegible(hora) {
  if (!hora) return '';
  const [h, m] = hora.split(':');
  return `${h}:${m}`;
}

export function descargarArchivoIcs(contenido, nombreArchivo) {
  const blob = new Blob([contenido], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(url);
}
