export function mensajeErrorPanelAdmin(err) {
  if (err?.conflictoPlataforma) {
    return (
      'No tienes permiso para ver estos datos. Cierra sesión e inicia de nuevo con tu cuenta de administrador de la marca.'
    );
  }

  if (err?.codigoHttp === 403) {
    return 'No tienes permiso para realizar esta acción.';
  }

  return err?.message ?? 'Ocurrió un error';
}
