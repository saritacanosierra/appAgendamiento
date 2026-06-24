import {
  recordatorioWhatsappServicio,
  configuracionRecordatorioWhatsapp,
} from '../servicios/recordatorioWhatsappServicio.js';

let intervaloId = null;
let procesando = false;

export function iniciarProgramadorRecordatoriosWhatsapp() {
  const config = configuracionRecordatorioWhatsapp();

  if (!config.habilitado) {
    console.info('[whatsapp-recordatorio] Programador deshabilitado (WHATSAPP_RECORDATORIO_HABILITADO=0).');
    return;
  }

  if (intervaloId) return;

  const intervaloMs = config.intervaloMinutos * 60_000;

  async function ejecutar() {
    if (procesando) return;
    procesando = true;
    try {
      await recordatorioWhatsappServicio.procesarPendientes();
    } catch (err) {
      console.error('[whatsapp-recordatorio] Fallo en ciclo:', err.message);
    } finally {
      procesando = false;
    }
  }

  setTimeout(ejecutar, 15_000);
  intervaloId = setInterval(ejecutar, intervaloMs);

  console.info(
    `[whatsapp-recordatorio] Programador activo — cada ${config.intervaloMinutos} min, `
      + `${config.horasAntes} h antes del servicio.`
  );
}

export function detenerProgramadorRecordatoriosWhatsapp() {
  if (intervaloId) {
    clearInterval(intervaloId);
    intervaloId = null;
  }
}
