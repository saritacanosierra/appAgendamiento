export function precioConDescuento(precio, porcentaje) {
  const base = Number(precio);
  const pct = Number(porcentaje);
  if (!Number.isFinite(base) || !Number.isFinite(pct) || pct <= 0) return Math.max(0, Math.round(base) || 0);
  return Math.max(0, Math.round((base * (100 - pct)) / 100));
}

export function validarPremioConfig(puntos, porcentaje) {
  const puntosTexto = String(puntos ?? '').trim();
  const porcentajeTexto = String(porcentaje ?? '').trim();
  if (!puntosTexto && !porcentajeTexto) return { premio: null };

  const necesarios = Number(puntosTexto);
  const pct = Number(porcentajeTexto);
  if (!Number.isInteger(necesarios) || necesarios < 1 || necesarios > 100000) {
    return { error: 'Los puntos del premio deben ser un número entero mayor que cero.' };
  }
  if (!Number.isInteger(pct) || pct < 1 || pct > 100) {
    return { error: 'El descuento debe ser un porcentaje entre 1 y 100.' };
  }
  return { premio: { puntosNecesarios: necesarios, porcentaje: pct } };
}

export function armarResumenPremio({
  puntosTotales = 0,
  puntosCanjeados = 0,
  serviciosCompletados = 0,
  puntosNecesarios = null,
  porcentaje = null,
  pendiente = null,
} = {}) {
  const totales = Math.max(0, Number(puntosTotales) || 0);
  const canjeados = Math.max(0, Number(puntosCanjeados) || 0);
  const disponibles = Math.max(0, totales - canjeados);
  const necesarios = Number(puntosNecesarios);
  const pct = Number(porcentaje);
  const activo = Number.isInteger(necesarios) && necesarios > 0
    && Number.isInteger(pct) && pct >= 1 && pct <= 100;
  const premioPendiente = pendiente
    ? {
      id: Number(pendiente.id),
      citaId: pendiente.citaId ?? pendiente.cita_id ?? null,
      puntosUsados: Number(pendiente.puntosUsados ?? pendiente.puntos_usados),
      porcentaje: Number(pendiente.porcentaje),
    }
    : null;
  const alcanza = activo && !premioPendiente && disponibles >= necesarios;

  return {
    activo,
    puntosTotales: totales,
    puntosCanjeados: canjeados,
    puntosDisponibles: disponibles,
    serviciosCompletados: Math.max(0, Number(serviciosCompletados) || 0),
    puntosNecesarios: activo ? necesarios : null,
    porcentaje: activo ? pct : null,
    alcanza,
    premioPendiente,
  };
}
