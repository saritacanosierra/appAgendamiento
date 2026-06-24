/**
 * Crea tabla galeria_catalogo (categorias y temporadas por marca).
 * Uso: node scripts/migrar-galeria-catalogo.js
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { generarSlug } from '../src/utilidades/slug.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sqlPath = path.resolve(__dirname, '../../base_de_datos/migraciones/008_galeria_catalogo.sql');
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
    console.log('Tabla galeria_catalogo creada o ya existente.');
    await sembrarDesdeDisenos(conexion);
  } catch (err) {
    if (err.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('Tabla galeria_catalogo ya existe.');
    } else {
      throw err;
    }
  } finally {
    await conexion.end();
  }
}

async function sembrarDesdeDisenos(conexion) {
  const [filas] = await conexion.query(
    `SELECT marca_id, categoria, temporada FROM disenos_galeria
     WHERE categoria IS NOT NULL OR temporada IS NOT NULL`
  );

  let insertados = 0;

  for (const fila of filas) {
    for (const [tipo, valorRaw] of [
      ['categoria', fila.categoria],
      ['temporada', fila.temporada],
    ]) {
      const etiqueta = (valorRaw ?? '').trim();
      if (!etiqueta) continue;

      const valor = generarSlug(etiqueta) || tipo;
      const [resultado] = await conexion.query(
        `INSERT IGNORE INTO galeria_catalogo
         (marca_id, tipo, etiqueta, valor, activo, orden_visualizacion)
         VALUES (?, ?, ?, ?, 1, 0)`,
        [fila.marca_id, tipo, etiqueta, valor]
      );

      if (resultado.affectedRows > 0) insertados += 1;

      const columna = tipo === 'categoria' ? 'categoria' : 'temporada';
      await conexion.query(
        `UPDATE disenos_galeria
         SET ${columna} = ?
         WHERE marca_id = ? AND TRIM(${columna}) = ?`,
        [valor, fila.marca_id, etiqueta]
      );
    }
  }

  if (insertados > 0) {
    console.log(`Catalogo inicial: ${insertados} opcion(es) importadas desde disenos existentes.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
