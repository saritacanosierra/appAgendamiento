import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import { respuestaError } from '../utilidades/respuestaJson.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const directorioSubidas = path.resolve(__dirname, '../../subidas');

const CARPETAS_PERMITIDAS = new Set(['galeria', 'blog', 'logos']);
const MIME_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const TAMANO_MAXIMO = 5 * 1024 * 1024;

function asegurarCarpetas() {
  for (const carpeta of CARPETAS_PERMITIDAS) {
    const ruta = path.join(directorioSubidas, carpeta);
    if (!fs.existsSync(ruta)) {
      fs.mkdirSync(ruta, { recursive: true });
    }
  }
}

asegurarCarpetas();

function almacenamiento(carpeta) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(directorioSubidas, carpeta));
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const base = path.basename(file.originalname, ext)
        .replace(/[^a-z0-9]+/gi, '-')
        .slice(0, 40) || 'archivo';
      const sufijo = `${req.marcaId}-${Date.now()}`;
      cb(null, `${base}-${sufijo}${ext}`);
    },
  });
}

function filtroArchivo(_req, file, cb) {
  if (!MIME_PERMITIDOS.has(file.mimetype)) {
    cb(new Error('Tipo de archivo no permitido. Use JPG, PNG, WEBP o GIF.'));
    return;
  }
  cb(null, true);
}

export function subidaImagenMiddleware(carpeta) {
  if (!CARPETAS_PERMITIDAS.has(carpeta)) {
    throw new Error(`Carpeta de subida invalida: ${carpeta}`);
  }

  const upload = multer({
    storage: almacenamiento(carpeta),
    limits: { fileSize: TAMANO_MAXIMO },
    fileFilter: filtroArchivo,
  }).single('archivo');

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return respuestaError(res, 'La imagen supera el tamano maximo de 5 MB.', 422);
      }
      if (err) {
        return respuestaError(res, err.message || 'Error al subir archivo.', 422);
      }
      if (!req.file) {
        return respuestaError(res, 'No se recibio ningun archivo.', 422);
      }
      req.rutaSubida = `/subidas/${carpeta}/${req.file.filename}`;
      next();
    });
  };
}

export function rutaPublicaSubida(carpeta, nombreArchivo) {
  return `/subidas/${carpeta}/${nombreArchivo}`;
}
