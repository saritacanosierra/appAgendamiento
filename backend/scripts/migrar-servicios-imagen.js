/**
 * Agrega columna imagen_ruta a servicios.
 * Uso: node scripts/migrar-servicios-imagen.js
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sql = `ALTER TABLE servicios
  ADD COLUMN imagen_ruta VARCHAR(500) NULL AFTER descripcion`;

async function main() {
  const conexion = await mysql.createConnection({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PUERTO ?? 3306),
    user: process.env.DB_USUARIO ?? 'root',
    password: process.env.DB_CONTRASENA ?? '',
    database: process.env.DB_NOMBRE ?? 'spa_unas',
  });

  try {
    await conexion.query(sql);
    console.log('Columna imagen_ruta agregada a servicios.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Columna imagen_ruta ya existe.');
    } else {
      throw err;
    }
  } finally {
    await conexion.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
