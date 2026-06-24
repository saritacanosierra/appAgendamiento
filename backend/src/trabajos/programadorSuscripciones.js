import { suscripcionMarcaServicio } from '../servicios/suscripcionMarcaServicio.js';

let intervaloId = null;
let procesando = false;

function suscripcionHabilitada() {
  const raw = process.env.SUSCRIPCION_PROGRAMADOR_HABILITADO;
  if (raw === '0' || raw === 'false') return false;
  return true;
}

function intervaloMs() {
  const horas = Number(process.env.SUSCRIPCION_INTERVALO_HORAS ?? 24);
  return Math.max(1, horas) * 60 * 60 * 1000;
}

export function iniciarProgramadorSuscripciones() {
  if (!suscripcionHabilitada()) {
    console.info('[suscripcion] Programador deshabilitado (SUSCRIPCION_PROGRAMADOR_HABILITADO=0).');
    return;
  }

  if (intervaloId) return;

  async function ejecutar() {
    if (procesando) return;
    procesando = true;
    try {
      const resultado = await suscripcionMarcaServicio.procesarCicloDiario();
      if (resultado.vencidas > 0 || resultado.avisos > 0) {
        console.info(
          `[suscripcion] Ciclo: ${resultado.revisadas} marcas, `
            + `${resultado.avisos} avisos, ${resultado.vencidas} vencidas.`
        );
      }
    } catch (err) {
      console.error('[suscripcion] Fallo en ciclo:', err.message);
    } finally {
      procesando = false;
    }
  }

  setTimeout(ejecutar, 20_000);
  intervaloId = setInterval(ejecutar, intervaloMs());

  console.info(`[suscripcion] Programador activo — cada ${intervaloMs() / 3_600_000} h.`);
}

export function detenerProgramadorSuscripciones() {
  if (intervaloId) {
    clearInterval(intervaloId);
    intervaloId = null;
  }
}
