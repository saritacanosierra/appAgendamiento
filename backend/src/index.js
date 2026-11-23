import { crearApp, entorno } from './app.js';
import { iniciarProgramadorRecordatoriosWhatsapp } from './trabajos/programadorRecordatoriosWhatsapp.js';
import { iniciarProgramadorSuscripciones } from './trabajos/programadorSuscripciones.js';
import { iniciarProgramadorCopias } from './trabajos/programadorCopias.js';
import { logger } from './utilidades/logger.js';
import { almacenamientoS3Habilitado } from './servicios/almacenamientoArchivosServicio.js';
import { obtenerClienteRedis, redisEstaDisponible } from './utilidades/clienteRedis.js';

const app = crearApp();

const esVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

if (!esVercel) {
  app.listen(entorno.puerto, '0.0.0.0', async () => {
    await obtenerClienteRedis();
    const redisOk = redisEstaDisponible();
    if (entorno.nodeEnv === 'produccion' && !process.env.REDIS_URL?.trim()) {
      logger.warn(
        'Produccion sin REDIS_URL: rate limit y cache quedan en memoria (no apto multi-instancia).'
      );
    }
    logger.info({
      puerto: entorno.puerto,
      entorno: entorno.nodeEnv,
      almacenamientoImagenes: almacenamientoS3Habilitado() ? 's3' : 'local',
      redis: redisOk,
    }, 'API iniciada');
    iniciarProgramadorRecordatoriosWhatsapp();
    iniciarProgramadorSuscripciones();
    iniciarProgramadorCopias();
  });
}

export default app;
