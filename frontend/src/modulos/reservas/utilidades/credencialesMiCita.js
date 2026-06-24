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
  const correo = String(data.correo ?? '').trim();

  if (!telefono || !correo) return null;

  return { telefono, correo };
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

export function guardarCredencialesMiCita(marcaId, { telefono, correo }) {
  if (!marcaId || typeof localStorage === 'undefined') return;

  const tel = String(telefono ?? '').trim();
  const mail = String(correo ?? '').trim();

  if (!tel || !mail) return;

  localStorage.setItem(
    claveMarca(marcaId),
    JSON.stringify({ telefono: tel, correo: mail })
  );
}

export function limpiarCredencialesMiCita(marcaId) {
  if (!marcaId || typeof localStorage === 'undefined') return;
  localStorage.removeItem(claveMarca(marcaId));
}
