/** Servicio para enlaces Google Calendar e ICS */
export class CalendarioServicio {
  generarEnlaceGoogleCalendar(cita) {
    const titulo = encodeURIComponent(cita.titulo ?? 'Cita spa de unas');
    const inicio = this.formatearFechaGoogle(cita.fecha_inicio ?? '');
    const fin = this.formatearFechaGoogle(cita.fecha_fin ?? '');
    const detalles = encodeURIComponent(cita.descripcion ?? '');
    const ubicacion = encodeURIComponent(cita.ubicacion ?? '');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${inicio}/${fin}&details=${detalles}&location=${ubicacion}`;
  }

  generarArchivoIcs(cita) {
    const uid = cita.codigo ?? `cita-${Date.now()}`;
    const titulo = this.escaparIcs(cita.titulo ?? 'Cita spa de unas');
    const inicio = this.formatearFechaIcs(cita.fecha_inicio ?? '');
    const fin = this.formatearFechaIcs(cita.fecha_fin ?? '');
    const descripcion = this.escaparIcs(cita.descripcion ?? '');
    const ubicacion = this.escaparIcs(cita.ubicacion ?? '');
    const dtstamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Spa Unas//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}@spa-unas`,
      `DTSTAMP:${dtstamp.slice(0, 15)}Z`,
      `DTSTART:${inicio}`,
      `DTEND:${fin}`,
      `SUMMARY:${titulo}`,
      `DESCRIPTION:${descripcion}`,
      `LOCATION:${ubicacion}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  }

  formatearFechaGoogle(fechaHora) {
    const d = fechaHora ? new Date(fechaHora) : new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  formatearFechaIcs(fechaHora) {
    return this.formatearFechaGoogle(fechaHora);
  }

  escaparIcs(texto) {
    return String(texto).replace(/\r\n|\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  }
}
