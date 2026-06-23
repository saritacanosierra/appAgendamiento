import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const ANCHO_MAXIMO = Number(process.env.IMAGEN_ANCHO_MAXIMO ?? 1920);
const CALIDAD_WEBP = Number(process.env.IMAGEN_CALIDAD_WEBP ?? 80);

const FORMATOS_SIN_OPTIMIZAR = new Set(['image/gif', 'image/svg+xml']);

export async function optimizarImagenSubida(rutaAbsoluta, mimetype) {
  if (FORMATOS_SIN_OPTIMIZAR.has(mimetype)) {
    return {
      ruta: rutaAbsoluta,
      optimizado: false,
      nombreArchivo: path.basename(rutaAbsoluta),
      motivo: 'formato_sin_optimizar',
    };
  }

  const ext = path.extname(rutaAbsoluta).toLowerCase();
  const directorio = path.dirname(rutaAbsoluta);
  const nombreBase = path.basename(rutaAbsoluta, ext);
  const destino = path.join(directorio, `${nombreBase}.webp`);

  try {
    await sharp(rutaAbsoluta)
      .rotate()
      .resize({
        width: ANCHO_MAXIMO,
        height: ANCHO_MAXIMO,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: CALIDAD_WEBP })
      .toFile(destino);

    await fs.unlink(rutaAbsoluta);

    return {
      ruta: destino,
      optimizado: true,
      nombreArchivo: path.basename(destino),
    };
  } catch {
    return {
      ruta: rutaAbsoluta,
      optimizado: false,
      nombreArchivo: path.basename(rutaAbsoluta),
      motivo: 'optimizacion_omitida',
    };
  }
}
