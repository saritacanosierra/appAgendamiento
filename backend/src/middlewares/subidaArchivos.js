import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import { respuestaError } from '../utilidades/respuestaJson.js';
import { optimizarImagenSubida } from '../utilidades/optimizarImagen.js';
import { publicarImagenSubida } from '../servicios/almacenamientoArchivosServicio.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const directorioSubidas = path.resolve(__dirname, '../../subidas');

const CARPETAS_PERMITIDAS = new Set(['galeria', 'blog', 'logos', 'carrusel', 'servicios']);

const MIME_POR_EXTENSION = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

const MIME_PERMITIDOS = new Set(Object.values(MIME_POR_EXTENSION));
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

function resolverMime(file, carpeta) {
  if (MIME_PERMITIDOS.has(file.mimetype)) {
    return file.mimetype;
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const mimePorExt = MIME_POR_EXTENSION[ext];
  if (!mimePorExt) return null;

  if (mimePorExt === 'image/svg+xml' && carpeta !== 'logos') {
    return null;
  }

  return mimePorExt;
}

function filtroArchivo(carpeta) {
  return (_req, file, cb) => {
    const mime = resolverMime(file, carpeta);
    if (!mime) {
      const formatos = carpeta === 'logos'
        ? 'JPG, PNG, WEBP, GIF o SVG'
        : 'JPG, PNG, WEBP o GIF';
      cb(new Error(`Tipo de archivo no permitido. Use ${formatos}.`));
      return;
    }

    file.mimetype = mime;
    cb(null, true);
  };
}

export function subidaImagenMiddleware(carpeta) {
  if (!CARPETAS_PERMITIDAS.has(carpeta)) {
    throw new Error(`Carpeta de subida invalida: ${carpeta}`);
  }

  const upload = multer({
    storage: almacenamiento(carpeta),
    limits: { fileSize: TAMANO_MAXIMO },
    fileFilter: filtroArchivo(carpeta),
  }).single('archivo');

  return (req, res, next) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return respuestaError(res, 'La imagen supera el tamano maximo de 5 MB.', 422);
      }
      if (err) {
        return respuestaError(res, err.message || 'Error al subir archivo.', 422);
      }
      if (!req.file) {
        return respuestaError(res, 'No se recibio ningun archivo.', 422);
      }

      try {
        const resultado = await optimizarImagenSubida(req.file.path, req.file.mimetype);
        req.file.filename = resultado.nombreArchivo;
        req.file.path = resultado.ruta;
        req.rutaSubida = await publicarImagenSubida({
          rutaLocal: resultado.ruta,
          carpeta,
          nombreArchivo: resultado.nombreArchivo,
          contentType: req.file.mimetype,
        });
        next();
      } catch (errorOpt) {
        return respuestaError(res, errorOpt.message || 'Error al procesar imagen.', 422);
      }
    });
  };
}

export function rutaPublicaSubida(carpeta, nombreArchivo) {
  return `/subidas/${carpeta}/${nombreArchivo}`;
}
