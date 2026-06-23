export function verificarMarcaOperativa(marca) {
  if (!marca) {
    return { ok: false, error: 'Marca no encontrada.', codigoHttp: 404 };
  }
  if (!marca.activa) {
    return {
      ok: false,
      error: 'Esta empresa esta suspendida. Contacta al administrador de la plataforma.',
      codigoHttp: 403,
    };
  }
  if (!marca.plan_habilitado) {
    return {
      ok: false,
      error: 'El plan de esta empresa no esta activo. Las reservas estan deshabilitadas.',
      codigoHttp: 403,
    };
  }
  return { ok: true };
}
