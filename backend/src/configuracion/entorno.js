import dotenv from 'dotenv';

dotenv.config();

export const entorno = {
  nodeEnv: process.env.NODE_ENV ?? 'desarrollo',
  depuracion: (process.env.NODE_ENV ?? 'desarrollo') !== 'produccion',
  puerto: Number(process.env.PUERTO ?? 3000),
  zonaHoraria: process.env.ZONA_HORARIA ?? 'America/Mexico_City',
  claveSecretaSesion: process.env.CLAVE_SECRETA_SESION ?? 'cambiar-clave',
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
};

export const corsOrigenes = (process.env.CORS_ORIGENES ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
