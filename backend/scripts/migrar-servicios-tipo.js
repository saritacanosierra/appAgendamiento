/**
 * Agrega columna tipo (marca | adicional) a servicios.
 * Uso: npm run migrar:servicios-tipo
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sentencias = [
  `ALTER TABLE servicios
    ADD COLUMN tipo ENUM('marca', 'adicional') NOT NULL DEFAULT 'marca' AFTER activo`,
  `CREATE INDEX idx_servicios_tipo ON servicios (marca_id, tipo, activo)`,
];

async function main() {
  const conexion = await mysql.createConnection({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PUERTO ?? 3306),
    user: process.env.DB_USUARIO ?? 'root',
    password: process.env.DB_CONTRASENA ?? '',
    database: process.env.DB_NOMBRE ?? 'spa_unas',
  });

  try {
    for (const sql of sentencias) {
      try {
        await conexion.query(sql);
        console.log('OK:', sql.split('\n')[0].trim());
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_KEYNAME') {
          console.log('Ya aplicado:', sql.split('\n')[0].trim());
        } else {
          throw err;
        }
      }
    }
    console.log('Migracion servicios tipo completada.');
  } finally {
    await conexion.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
