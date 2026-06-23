const DIAS_SEMANA = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
];

export function nombreDiaDesdeFecha(fecha) {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const dt = new Date(anio, mes - 1, dia);
  return DIAS_SEMANA[dt.getDay()];
}

export function minutosDesdeMedianoche(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export function minutosAHora(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function sumarMinutosAHora(hora, minutos) {
  return minutosAHora(minutosDesdeMedianoche(hora) + minutos);
}

export function normalizarHora(hora) {
  const partes = hora.split(':');
  return `${partes[0].padStart(2, '0')}:${partes[1].padStart(2, '0')}`;
}

/**
 * Genera horarios disponibles segun apertura/cierre, duracion y citas existentes.
 */
export function calcularHorariosDisponibles({
  horarioDia,
  duracionMinutos,
  citasOcupadas = [],
  intervaloMinutos = 15,
}) {
  if (!horarioDia?.apertura || !horarioDia?.cierre) {
    return [];
  }

  const inicio = minutosDesdeMedianoche(normalizarHora(horarioDia.apertura));
  const fin = minutosDesdeMedianoche(normalizarHora(horarioDia.cierre));
  const ultimoInicio = fin - duracionMinutos;

  if (ultimoInicio < inicio) {
    return [];
  }

  const horarios = [];

  for (let min = inicio; min <= ultimoInicio; min += intervaloMinutos) {
    const horaInicio = minutosAHora(min);
    const horaFin = minutosAHora(min + duracionMinutos);

    const solapa = citasOcupadas.some(
      (cita) =>
        minutosDesdeMedianoche(cita.hora_inicio) < min + duracionMinutos
        && minutosDesdeMedianoche(cita.hora_fin) > min
    );

    if (!solapa) {
      horarios.push(horaInicio);
    }
  }

  return horarios;
}

export function construirFechaHoraLocal(fecha, hora) {
  return `${fecha}T${normalizarHora(hora)}:00`;
}

export function fechaEsPasada(fecha) {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const objetivo = new Date(anio, mes - 1, dia);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return objetivo < hoy;
}

export function filtrarHorasPasadas(fecha, horarios) {
  const hoy = new Date();
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  if (fecha !== hoyStr) {
    return horarios;
  }

  const ahoraMin = hoy.getHours() * 60 + hoy.getMinutes();
  return horarios.filter((h) => minutosDesdeMedianoche(h) > ahoraMin);
}
