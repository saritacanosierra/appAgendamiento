import { copiaMarcaServicio } from '../servicios/copiaMarcaServicio.js';

let intervaloId = null;
let procesando = false;

function copiasHabilitadas() {
  const raw = process.env.COPIAS_PROGRAMADOR_HABILITADO;
  if (raw === '0' || raw === 'false') return false;
  return true;
}

export function iniciarProgramadorCopias() {
  if (!copiasHabilitadas()) {
    console.info('[copias] Programador deshabilitado (COPIAS_PROGRAMADOR_HABILITADO=0).');
    return;
  }

  if (intervaloId) return;

  async function ejecutar() {
    if (procesando) return;
    procesando = true;
    try {
      const resultado = await copiaMarcaServicio.guardarSemanales();
      if (resultado.guardadas > 0) {
        console.info(`[copias] Semana: ${resultado.guardadas} de ${resultado.revisadas} empresas.`);
      }
    } catch (err) {
      console.error('[copias] Fallo al guardar:', err.message);
    } finally {
      procesando = false;
    }
  }

  setTimeout(ejecutar, 30_000);
  intervaloId = setInterval(ejecutar, 6 * 60 * 60 * 1000);
  console.info('[copias] Programador activo — una copia por empresa cada 7 dias.');
}

export function detenerProgramadorCopias() {
  if (intervaloId) {
    clearInterval(intervaloId);
    intervaloId = null;
  }
}
