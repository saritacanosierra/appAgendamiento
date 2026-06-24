import { crearApp, entorno } from './app.js';
import { iniciarProgramadorRecordatoriosWhatsapp } from './trabajos/programadorRecordatoriosWhatsapp.js';
import { iniciarProgramadorSuscripciones } from './trabajos/programadorSuscripciones.js';

const app = crearApp();

const esVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

if (!esVercel) {
  app.listen(entorno.puerto, '0.0.0.0', () => {
    console.log(`Spa Unas API (Node.js) — http://localhost:${entorno.puerto}/api/estado`);
    console.log(`Entorno: ${entorno.nodeEnv}`);
    iniciarProgramadorRecordatoriosWhatsapp();
    iniciarProgramadorSuscripciones();
  });
}

export default app;
