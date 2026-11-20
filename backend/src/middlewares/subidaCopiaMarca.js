import multer from 'multer';
import { respuestaError } from '../utilidades/respuestaJson.js';

const subida = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
}).single('archivo');

export function subidaCopiaMarca(req, res, next) {
  subida(req, res, (error) => {
    if (error) {
      return respuestaError(res, 'No se pudo leer la copia. Usa el archivo JSON de una sola empresa.', 400);
    }
    if (!req.file) {
      return respuestaError(res, 'Falta el archivo de la copia.', 422);
    }
    const nombre = String(req.file.originalname ?? '').toLowerCase();
    if (!nombre.endsWith('.json')) {
      return respuestaError(res, 'El archivo tiene que ser JSON.', 422);
    }
    next();
  });
}
