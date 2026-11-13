import { planEstaVencido } from './suscripcionMarca.js';

export function verificarMarcaOperativa(marca) {
  if (!marca) {
    return { ok: false, error: 'Marca no encontrada.', codigoHttp: 404 };
  }
  if (!marca.activa) {
    return {
      ok: false,
      error: 'Esta empresa esta suspendida. Contacta al administrador de la plataforma.',
      codigoHttp: 403,
      codigo: 'marca_suspendida',
    };
  }
  if (!marca.plan_habilitado) {
    return {
      ok: false,
      error: 'El plan de esta empresa no esta activo. Las reservas estan deshabilitadas.',
      codigoHttp: 403,
      codigo: 'plan_inactivo',
    };
  }
  if (planEstaVencido(marca)) {
    return {
      ok: false,
      error: 'El tiempo del plan se acabo. Las reservas estan pausadas hasta un nuevo pago. Los datos siguen guardados.',
      codigoHttp: 403,
      codigo: 'plan_vencido',
    };
  }
  return { ok: true };
}

/** El plan ya vencio y la duena puede entrar solo a pagar. Una suspension manual no se paga por aqui. */
export function planSePuedePagar(marca, operativa) {
  if (!operativa || operativa.ok) return false;
  if (operativa.codigo === 'plan_vencido') return true;
  return operativa.codigo === 'plan_inactivo' && planEstaVencido(marca);
}
