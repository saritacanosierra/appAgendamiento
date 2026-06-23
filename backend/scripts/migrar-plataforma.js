/**
 * Ejecuta migracion 001 plataforma superadmin.
 * Uso: npm run migrar:plataforma
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sentencias = [
  `ALTER TABLE marcas ADD COLUMN plan_habilitado TINYINT(1) NOT NULL DEFAULT 1 AFTER activa`,
  `ALTER TABLE usuarios MODIFY marca_id INT UNSIGNED NULL`,
  `ALTER TABLE usuarios MODIFY rol ENUM('superadmin', 'admin', 'staff') NOT NULL DEFAULT 'admin'`,
  `ALTER TABLE tokens_sesion MODIFY marca_id INT UNSIGNED NULL`,
  `CREATE TABLE IF NOT EXISTS configuracion_plataforma (
    clave VARCHAR(80) NOT NULL PRIMARY KEY,
    valor TEXT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

async function main() {
  const conexion = await mysql.createConnection({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PUERTO ?? 3306),
    user: process.env.DB_USUARIO ?? 'root',
    password: process.env.DB_CONTRASENA ?? '',
    database: process.env.DB_NOMBRE ?? 'spa_unas',
    multipleStatements: true,
  });

  for (const sql of sentencias) {
    try {
      await conexion.query(sql);
      console.log('OK:', sql.slice(0, 60), '...');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('Omitido (ya aplicado):', sql.slice(0, 50));
      } else {
        throw err;
      }
    }
  }

  await conexion.end();
  console.log('\nMigracion plataforma completada.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
