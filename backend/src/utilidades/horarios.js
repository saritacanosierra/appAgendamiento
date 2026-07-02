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

/** true si el tramo [horaInicio, horaFin) intersecta algun bloqueo/descanso del dia. */
export function solapaConBloqueos(horaInicio, duracionMinutos, bloqueos = []) {
  if (!bloqueos?.length) return false;

  const inicio = minutosDesdeMedianoche(normalizarHora(horaInicio));
  const fin = inicio + duracionMinutos;

  return bloqueos.some((bloqueo) => {
    if (!bloqueo?.desde || !bloqueo?.hasta) return false;
    const bloqueoInicio = minutosDesdeMedianoche(normalizarHora(bloqueo.desde));
    const bloqueoFin = minutosDesdeMedianoche(normalizarHora(bloqueo.hasta));
    if (bloqueoFin <= bloqueoInicio) return false;
    return inicio < bloqueoFin && fin > bloqueoInicio;
  });
}

/**
 * Genera horarios disponibles segun apertura/cierre, bloqueos, duracion y citas existentes.
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

  const bloqueos = horarioDia.bloqueos ?? [];
  const inicio = minutosDesdeMedianoche(normalizarHora(horarioDia.apertura));
  const fin = minutosDesdeMedianoche(normalizarHora(horarioDia.cierre));
  const ultimoInicio = fin - duracionMinutos;

  if (ultimoInicio < inicio) {
    return [];
  }

  const horarios = [];

  for (let min = inicio; min <= ultimoInicio; min += intervaloMinutos) {
    const horaInicio = minutosAHora(min);

    const solapaCita = citasOcupadas.some(
      (cita) =>
        minutosDesdeMedianoche(cita.hora_inicio) < min + duracionMinutos
        && minutosDesdeMedianoche(cita.hora_fin) > min
    );

    const solapaBloqueo = solapaConBloqueos(horaInicio, duracionMinutos, bloqueos);

    if (!solapaCita && !solapaBloqueo) {
      horarios.push(horaInicio);
    }
  }

  return horarios;
}

/** Normaliza bloqueos dentro del objeto horarios de una marca. */
export function normalizarHorariosMarca(horarios = {}) {
  if (!horarios || typeof horarios !== 'object') return {};

  const normalizado = {};

  for (const [dia, horario] of Object.entries(horarios)) {
    if (!horario) {
      normalizado[dia] = null;
      continue;
    }

    const bloqueos = (horario.bloqueos ?? [])
      .map((b) => ({
        desde: normalizarHora(String(b.desde ?? '')),
        hasta: normalizarHora(String(b.hasta ?? '')),
      }))
      .filter((b) => {
        if (!b.desde || !b.hasta) return false;
        return minutosDesdeMedianoche(b.desde) < minutosDesdeMedianoche(b.hasta);
      });

    normalizado[dia] = {
      apertura: normalizarHora(horario.apertura ?? '10:00'),
      cierre: normalizarHora(horario.cierre ?? '19:00'),
      bloqueos,
    };
  }

  return normalizado;
}

/** Comprueba si una cita cabe en el horario del dia (apertura/cierre y sin bloqueos). */
export function horarioPermitidoParaCita(horarioDia, horaInicio, duracionMinutos) {
  if (!horarioDia?.apertura || !horarioDia?.cierre) {
    return { ok: false, error: 'La marca no atiende este dia.' };
  }

  const inicio = minutosDesdeMedianoche(normalizarHora(horaInicio));
  const fin = inicio + duracionMinutos;
  const apertura = minutosDesdeMedianoche(normalizarHora(horarioDia.apertura));
  const cierre = minutosDesdeMedianoche(normalizarHora(horarioDia.cierre));

  if (inicio < apertura || fin > cierre) {
    return { ok: false, error: 'Fuera del horario de atencion.' };
  }

  if (solapaConBloqueos(horaInicio, duracionMinutos, horarioDia.bloqueos)) {
    return { ok: false, error: 'Horario bloqueado (descanso).' };
  }

  return { ok: true };
}

export function construirFechaHoraLocal(fecha, hora) {
  return `${fecha}T${normalizarHora(hora)}:00`;
}

export const ANTELACION_MINIMA_CLIENTE_HORAS = 2;

/** Minutos restantes hasta el inicio de la cita (negativo si ya paso). */
export function minutosHastaInicioCita(fecha, horaInicio) {
  const inicio = new Date(construirFechaHoraLocal(fecha, horaInicio));
  return (inicio.getTime() - Date.now()) / 60_000;
}

export function cumpleAntelacionMinimaCliente(fecha, horaInicio, horasMinimas = ANTELACION_MINIMA_CLIENTE_HORAS) {
  return minutosHastaInicioCita(fecha, horaInicio) >= horasMinimas * 60;
}

/** Cancelacion publica permitida hasta el inicio del servicio (no incluye la hora exacta de inicio). */
export function puedeCancelarCitaPublica(fecha, horaInicio) {
  return minutosHastaInicioCita(fecha, horaInicio) > 0;
}

/** true si el servicio ya termino (para marcar como completada/atendida). */
export function citaServicioYaFinalizo(fecha, horaFin) {
  return minutosHastaInicioCita(fecha, horaFin) <= 0;
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
