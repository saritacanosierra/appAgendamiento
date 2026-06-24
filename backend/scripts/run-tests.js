/**
 * Ejecuta tests unitarios y HTTP sin depender de MySQL.
 */
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raizTests = path.join(__dirname, '../tests');

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'produccion';
}
if (!process.env.LOG_NIVEL) {
  process.env.LOG_NIVEL = 'error';
}

function listarArchivosTest(carpeta) {
  return readdirSync(carpeta, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.test.js'))
    .map((entry) => path.join(carpeta, entry.name));
}

const archivos = [
  ...listarArchivosTest(path.join(raizTests, 'unit')),
  ...listarArchivosTest(path.join(raizTests, 'http')),
];

const resultado = spawnSync(
  process.execPath,
  ['--test', '--test-force-exit', ...archivos],
  { stdio: 'inherit', env: process.env }
);

process.exit(resultado.status ?? 1);
