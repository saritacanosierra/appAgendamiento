import { formatearPrecio } from '../../../compartido/utilidades/temaMarca';

export const MIN_SEGUNDOS_CRONOMETRO = 5;

export const PASOS_ATENCION = [
  { id: 1, etiqueta: 'Seleccionar cita' },
  { id: 2, etiqueta: 'Medir tiempo' },
  { id: 3, etiqueta: 'Confirmar' },
];

export function inicialesCliente(nombre) {
  if (!nombre) return '?';
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function extraVacio() {
  return { concepto: '', monto: '' };
}

export function extraDesdeServicio(servicio) {
  return {
    concepto: servicio.nombre ?? '',
    monto: Number(servicio.precio) || 0,
    servicioId: servicio.id,
  };
}

export function prepararExtrasParaApi(listaExtras) {
  return listaExtras
    .map((extra) => ({
      concepto: String(extra.concepto ?? '').trim(),
      monto: Number(extra.monto) || 0,
      servicioId: extra.servicioId ?? null,
    }))
    .filter((extra) => extra.monto > 0 && (extra.servicioId || extra.concepto))
    .map(({ concepto, monto, servicioId }) =>
      servicioId ? { concepto, monto, servicioId } : { concepto, monto }
    );
}

export function mensajeConfirmacionAtencion(cita) {
  const facturacion = cita.facturacion ?? {};
  const precioBase = facturacion.precioBase ?? cita.servicio?.precio ?? 0;
  const precioAdicional = facturacion.precioAdicional ?? 0;
  const precioFinal = facturacion.precioFinal ?? precioBase + precioAdicional;
  const partes = [`${cita.cliente.nombre} — ${cita.servicio.nombre}.`];

  if (precioAdicional > 0) {
    const detalleExtras = (facturacion.extras ?? [])
      .map((extra) => `${extra.concepto} (${formatearPrecio(extra.monto)})`)
      .join(', ');
    partes.push(
      detalleExtras
        ? `Adicionales: ${detalleExtras}.`
        : `Adicionales: ${formatearPrecio(precioAdicional)}.`
    );
  }

  partes.push(`Total facturado: ${formatearPrecio(precioFinal)}.`);
  partes.push(`Duracion: ${facturacion.duracionRealMinutos ?? 0} min.`);

  return partes.join(' ');
}

export function pasoActivoAtencion(citaSeleccionada, segundosCronometro) {
  if (!citaSeleccionada) return 1;
  if (segundosCronometro < MIN_SEGUNDOS_CRONOMETRO) return 2;
  return 3;
}

export function etiquetaEstadoCronometro(activo, segundos) {
  if (activo) return 'Servicio en curso';
  if (segundos > 0) return 'Pausado';
  return 'Listo para iniciar';
}
