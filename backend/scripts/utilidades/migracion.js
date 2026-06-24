/**
 * Utilidades compartidas para migraciones de BD.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const CODIGOS_OMITIR = new Set([
  'ER_DUP_FIELDNAME',
  'ER_TABLE_EXISTS_ERROR',
  'ER_DUP_KEYNAME',
  'ER_CANT_DROP_FIELD_OR_KEY',
]);

export const RAIZ_PROYECTO = path.resolve(__dirname, '../../..');
export const CARPETA_MIGRACIONES = path.join(RAIZ_PROYECTO, 'base_de_datos/migraciones');

export async function crearConexion() {
  return mysql.createConnection({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PUERTO ?? 3306),
    user: process.env.DB_USUARIO ?? 'root',
    password: process.env.DB_CONTRASENA ?? '',
    database: process.env.DB_NOMBRE ?? 'spa_unas',
    multipleStatements: true,
  });
}

export async function asegurarTablaMigraciones(conexion) {
  await conexion.query(`
    CREATE TABLE IF NOT EXISTS schema_migraciones (
      id VARCHAR(80) NOT NULL PRIMARY KEY,
      nombre VARCHAR(200) NOT NULL,
      aplicada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function migracionAplicada(conexion, id) {
  const [filas] = await conexion.query(
    'SELECT id FROM schema_migraciones WHERE id = ? LIMIT 1',
    [id]
  );
  return filas.length > 0;
}

export async function marcarMigracion(conexion, id, nombre) {
  await conexion.query(
    'INSERT INTO schema_migraciones (id, nombre) VALUES (?, ?)',
    [id, nombre]
  );
}

export function limpiarSql(contenido) {
  return contenido
    .replace(/^\uFEFF/, '')
    .replace(/^USE\s+\w+\s*;/gim, '')
    .trim();
}

export async function ejecutarSql(conexion, sql) {
  const limpio = limpiarSql(sql);
  if (!limpio) return;

  try {
    await conexion.query(limpio);
  } catch (err) {
    if (CODIGOS_OMITIR.has(err.code)) return;
    throw err;
  }
}

export async function ejecutarArchivoSql(conexion, nombreArchivo) {
  const ruta = path.join(CARPETA_MIGRACIONES, nombreArchivo);
  const sql = fs.readFileSync(ruta, 'utf8');
  await ejecutarSql(conexion, sql);
}

export async function ejecutarSentencias(conexion, sentencias) {
  for (const sql of sentencias) {
    await ejecutarSql(conexion, sql);
  }
}

export async function aplicarMigracion(conexion, { id, nombre, ejecutar }) {
  if (await migracionAplicada(conexion, id)) {
    console.log(`  Omitida (ya aplicada): ${id}`);
    return false;
  }

  await ejecutar(conexion);
  await marcarMigracion(conexion, id, nombre);
  console.log(`  OK: ${id} — ${nombre}`);
  return true;
}
