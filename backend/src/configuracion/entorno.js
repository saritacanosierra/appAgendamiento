import dotenv from 'dotenv';

dotenv.config();

const esProduccion = (process.env.NODE_ENV ?? 'desarrollo') === 'produccion';
const envPlataforma = process.env.PLATAFORMA_HABILITADA;

function resolverPlataformaHabilitada() {
  if (envPlataforma === 'true' || envPlataforma === '1') return true;
  if (envPlataforma === 'false' || envPlataforma === '0') return false;
  return !esProduccion;
}

export const entorno = {
  nodeEnv: process.env.NODE_ENV ?? 'desarrollo',
  depuracion: !esProduccion,
  puerto: Number(process.env.PUERTO ?? 3000),
  zonaHoraria: process.env.ZONA_HORARIA ?? 'America/Mexico_City',
  claveSecretaSesion: process.env.CLAVE_SECRETA_SESION ?? 'cambiar-clave',
  plataformaHabilitada: resolverPlataformaHabilitada(),
};

export const baseDatos = {
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PUERTO ?? 3306),
  database: process.env.DB_NOMBRE ?? 'spa_unas',
  user: process.env.DB_USUARIO ?? 'root',
  password: process.env.DB_CONTRASENA ?? '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  ...(process.env.DB_SSL === '1' || process.env.DB_SSL === 'true'
    ? { ssl: { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } }
    : {}),
};

export const corsOrigenes = (process.env.CORS_ORIGENES ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

/** local = disco en backend/subidas; s3 = bucket S3 o R2 (API compatible). */
export const almacenamientoImagenes = {
  modo: (process.env.ALMACENAMIENTO_IMAGENES ?? 'local').toLowerCase(),
  bucket: process.env.S3_BUCKET ?? '',
  region: process.env.S3_REGION ?? 'auto',
  endpoint: process.env.S3_ENDPOINT ?? '',
  accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
  publicUrlBase: (process.env.S3_PUBLIC_URL_BASE ?? '').replace(/\/$/, ''),
};
