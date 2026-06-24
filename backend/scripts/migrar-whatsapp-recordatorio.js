/**
 * Columna whatsapp_recordatorio_enviado_at en citas.
 * Uso: node scripts/migrar-whatsapp-recordatorio.js
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sqlPath = path.resolve(
  __dirname,
  '../../base_de_datos/migraciones/010_citas_whatsapp_recordatorio.sql'
);
const sql = fs.readFileSync(sqlPath, 'utf8');

async function main() {
  const conexion = await mysql.createConnection({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PUERTO ?? 3306),
    user: process.env.DB_USUARIO ?? 'root',
    password: process.env.DB_CONTRASENA ?? '',
    database: process.env.DB_NOMBRE ?? 'spa_unas',
    multipleStatements: true,
  });

  try {
    await conexion.query(sql);
    console.log('Columna whatsapp_recordatorio_enviado_at creada o ya existente.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Columna whatsapp_recordatorio_enviado_at ya existe.');
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
