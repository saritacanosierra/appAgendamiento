import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import { corsOrigenes, entorno } from './configuracion/entorno.js';
import rutasApi from './rutas/api.js';
import { comprimirRespuestas } from './middlewares/comprimirRespuestas.js';
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
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  app.use(idPeticionMiddleware);

  app.use(cors({
    origin: (origen, callback) => {
      // Sin Error: si se lanza, Express responde 500 sin cabeceras CORS y el navegador oculta la causa.
      if (!origen || corsOrigenes.includes(origen)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id'],
    exposedHeaders: ['X-Nuevo-Token', 'X-Token-Expira', 'X-Request-Id'],
  }));

  app.use(express.json({ limit: '2mb' }));
  app.use(comprimirRespuestas);
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
    express.static(directorioSubidas, {
      maxAge: '7d',
      setHeaders(res) {
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      },
    }),
  );
  app.use('/api', rutasApi);

  app.use(rutaNoEncontrada);
  app.use(manejoErrores);

  return app;
}

export { entorno };
