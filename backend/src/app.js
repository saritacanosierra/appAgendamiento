import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import { corsOrigenes, entorno } from './configuracion/entorno.js';
import rutasApi from './rutas/api.js';
import { manejoErrores, rutaNoEncontrada } from './middlewares/manejoErrores.js';
import { idPeticionMiddleware } from './middlewares/idPeticionMiddleware.js';
import { directorioSubidas } from './middlewares/subidaArchivos.js';
import { registrarPeticiones } from './utilidades/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function crearApp() {
  const app = express();

  if (entorno.nodeEnv === 'produccion') {
    app.set('trust proxy', 1);
  }

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  app.use(idPeticionMiddleware);

  app.use(cors({
    origin: (origen, callback) => {
      if (!origen || corsOrigenes.includes(origen)) {
        callback(null, true);
      } else {
        callback(new Error('Origen no permitido por CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id'],
    exposedHeaders: ['X-Nuevo-Token', 'X-Token-Expira', 'X-Request-Id'],
  }));

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.disable('x-powered-by');

  app.use(registrarPeticiones);

  app.use(
    '/subidas',
    (_req, res, next) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
      next();
    },
    express.static(directorioSubidas),
  );
  app.use('/api', rutasApi);

  app.use(rutaNoEncontrada);
  app.use(manejoErrores);

  return app;
}

export { entorno };
