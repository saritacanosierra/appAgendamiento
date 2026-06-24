import { crearApp, entorno } from './app.js';
import { iniciarProgramadorRecordatoriosWhatsapp } from './trabajos/programadorRecordatoriosWhatsapp.js';
import { iniciarProgramadorSuscripciones } from './trabajos/programadorSuscripciones.js';
import { logger } from './utilidades/logger.js';
import { almacenamientoS3Habilitado } from './servicios/almacenamientoArchivosServicio.js';

const app = crearApp();

const esVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

if (!esVercel) {
  app.listen(entorno.puerto, '0.0.0.0', () => {
    logger.info({
      puerto: entorno.puerto,
      entorno: entorno.nodeEnv,
      almacenamientoImagenes: almacenamientoS3Habilitado() ? 's3' : 'local',
    }, 'API iniciada');
    iniciarProgramadorRecordatoriosWhatsapp();
    iniciarProgramadorSuscripciones();
  });
}

export default app;
