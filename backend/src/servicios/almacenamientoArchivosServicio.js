import fs from 'fs/promises';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { almacenamientoImagenes } from '../configuracion/entorno.js';
import { logger } from '../utilidades/logger.js';

let clienteS3;

const MIME_POR_EXTENSION = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

export function almacenamientoS3Habilitado() {
  const cfg = almacenamientoImagenes;
  return cfg.modo === 's3'
    && Boolean(cfg.bucket)
    && Boolean(cfg.accessKeyId)
    && Boolean(cfg.secretAccessKey)
    && Boolean(cfg.publicUrlBase);
}

function obtenerClienteS3() {
  if (!clienteS3) {
    const cfg = almacenamientoImagenes;
    clienteS3 = new S3Client({
      region: cfg.region,
      endpoint: cfg.endpoint || undefined,
      forcePathStyle: Boolean(cfg.endpoint),
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    });
  }
  return clienteS3;
}

function resolverContentType(nombreArchivo, contentType) {
  if (contentType) return contentType;
  const ext = path.extname(nombreArchivo).toLowerCase();
  return MIME_POR_EXTENSION[ext] ?? 'application/octet-stream';
}

async function subirAS3({ buffer, clave, contentType }) {
  const cfg = almacenamientoImagenes;
  await obtenerClienteS3().send(new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: clave,
    Body: buffer,
    ContentType: contentType,
  }));
}

/**
 * Publica una imagen optimizada: filesystem local o bucket S3/R2.
 * @returns {Promise<string>} URL o ruta publica (/subidas/... o https://cdn/...)
 */
export async function publicarImagenSubida({ rutaLocal, carpeta, nombreArchivo, contentType }) {
  const rutaRelativa = `/subidas/${carpeta}/${nombreArchivo}`;

  if (!almacenamientoS3Habilitado()) {
    return rutaRelativa;
  }

  const clave = `${carpeta}/${nombreArchivo}`;
  const mime = resolverContentType(nombreArchivo, contentType);
  const buffer = await fs.readFile(rutaLocal);

  await subirAS3({ buffer, clave, contentType: mime });

  try {
    await fs.unlink(rutaLocal);
  } catch (err) {
    logger.warn({ err, rutaLocal }, 'No se pudo eliminar archivo local tras subir a S3');
  }

  return `${almacenamientoImagenes.publicUrlBase}/${clave}`;
}
