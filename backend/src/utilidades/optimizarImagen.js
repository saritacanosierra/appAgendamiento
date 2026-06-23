import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const ANCHO_MAXIMO = Number(process.env.IMAGEN_ANCHO_MAXIMO ?? 1920);
const CALIDAD_WEBP = Number(process.env.IMAGEN_CALIDAD_WEBP ?? 80);

export async function optimizarImagenSubida(rutaAbsoluta, mimetype) {
  if (mimetype === 'image/gif') {
    return { ruta: rutaAbsoluta, optimizado: false, motivo: 'gif_sin_cambios' };
  }

  const ext = path.extname(rutaAbsoluta).toLowerCase();
  const directorio = path.dirname(rutaAbsoluta);
  const nombreBase = path.basename(rutaAbsoluta, ext);
  const destino = path.join(directorio, `${nombreBase}.webp`);

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
}
