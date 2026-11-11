const CLAVE_BASE = 'spa_unas_mi_cita_credenciales';

function claveMarca(marcaId) {
  return `${CLAVE_BASE}_${marcaId}`;
}

function leerDatosLocalMarca(marcaId) {
  if (!marcaId || typeof localStorage === 'undefined') return null;

  try {
    const raw = localStorage.getItem(claveMarca(marcaId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function leerTelefonoLocalMarca(marcaId) {
  const data = leerDatosLocalMarca(marcaId);
  const telefono = String(data?.telefono ?? '').trim();
  return telefono || null;
}

export function leerCredencialesMiCita(marcaId) {
  const data = leerDatosLocalMarca(marcaId);
  if (!data) return null;

  const telefono = String(data.telefono ?? '').trim();
  if (!telefono) return null;

  return { telefono };
}

export function guardarTelefonoLocalMarca(marcaId, telefono) {
  if (!marcaId || typeof localStorage === 'undefined') return;

  const tel = String(telefono ?? '').trim();
  if (!tel) return;

  const existente = leerDatosLocalMarca(marcaId) ?? {};
  localStorage.setItem(
    claveMarca(marcaId),
    JSON.stringify({ ...existente, telefono: tel })
  );
}

export function guardarCredencialesMiCita(marcaId, { telefono }) {
  if (!marcaId || typeof localStorage === 'undefined') return;

  const tel = String(telefono ?? '').trim();
  if (!tel) return;

  localStorage.setItem(
    claveMarca(marcaId),
    JSON.stringify({ telefono: tel })
  );
}

export function limpiarCredencialesMiCita(marcaId) {
  if (!marcaId || typeof localStorage === 'undefined') return;
  localStorage.removeItem(claveMarca(marcaId));
}
