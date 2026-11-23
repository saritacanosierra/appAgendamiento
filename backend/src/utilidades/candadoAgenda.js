/**
 * Serializa reservas del mismo día/estilista dentro de una transacción.
 * INSERT IGNORE + SELECT … FOR UPDATE evita la carrera cuando aún no hay citas.
 */
export function claveEstilistaCandado(estilistaId) {
  const n = Number(estilistaId);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
}

export async function adquirirCandadoAgendaDia(conexion, { marcaId, fecha, estilistaId = null }) {
  const marca = Number(marcaId);
  const estilistaClave = claveEstilistaCandado(estilistaId);

  if (!marca || !fecha) {
    const error = new Error('Candado de agenda incompleto.');
    error.codigoHttp = 500;
    throw error;
  }

  await conexion.execute(
    `INSERT IGNORE INTO agenda_candados (marca_id, fecha, estilista_clave)
     VALUES (?, ?, ?)`,
    [marca, fecha, estilistaClave]
  );

  const [filas] = await conexion.execute(
    `SELECT id FROM agenda_candados
     WHERE marca_id = ? AND fecha = ? AND estilista_clave = ?
     LIMIT 1
     FOR UPDATE`,
    [marca, fecha, estilistaClave]
  );

  if (!filas.length) {
    const error = new Error('No se pudo bloquear la agenda. Intenta de nuevo.');
    error.codigoHttp = 503;
    throw error;
  }

  return filas[0].id;
}
