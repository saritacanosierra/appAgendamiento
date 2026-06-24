export function formatearFechaSql(valor) {
  if (!valor) return null;
  if (valor instanceof Date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${valor.getFullYear()}-${pad(valor.getMonth() + 1)}-${pad(valor.getDate())}`;
  }
  return String(valor).slice(0, 10);
}

export function normalizarHoraSql(valor) {
  if (!valor) return null;
  const str = String(valor);
  return str.slice(0, 5);
}

export function mapearCitaAdmin(fila) {
  if (!fila) return null;

  return {
    id: fila.id,
    marcaId: fila.marca_id,
    codigo: fila.codigo_confirmacion,
    fecha: formatearFechaSql(fila.fecha),
    horaInicio: normalizarHoraSql(fila.hora_inicio),
    horaFin: normalizarHoraSql(fila.hora_fin),
    estado: fila.estado,
    canceladaPor: fila.cancelada_por ?? null,
    notasInternas: fila.notas_internas,
    cliente: {
      id: fila.cliente_id_ref ?? fila.cliente_id,
      nombre: fila.cliente_nombre,
      telefono: fila.cliente_telefono,
      correo: fila.cliente_correo,
    },
    servicio: {
      id: fila.servicio_id_ref ?? fila.servicio_id,
      nombre: fila.servicio_nombre,
      duracionMinutos: fila.duracion_minutos,
      precio: Number(fila.precio),
    },
    createdAt: fila.created_at,
  };
}

export function mapearClienteAdmin(fila) {
  return {
    id: fila.id,
    marcaId: fila.marca_id,
    nombre: fila.nombre,
    telefono: fila.telefono,
    correo: fila.correo,
    notas: fila.notas,
    createdAt: fila.created_at,
  };
}

export function rangoSemanaDesdeFecha(fechaStr) {
  const [anio, mes, dia] = fechaStr.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  const diaSemana = fecha.getDay();
  const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;

  const lunes = new Date(fecha);
  lunes.setDate(fecha.getDate() + diffLunes);

  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);

  return {
    desde: formatearFechaSql(lunes),
    hasta: formatearFechaSql(domingo),
  };
}
