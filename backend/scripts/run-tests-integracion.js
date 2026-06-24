/**
 * Tests de integracion con MySQL (local o CI con servicio BD).
 */
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const carpetaIntegracion = path.join(__dirname, '../tests/integracion');

process.env.TEST_INTEGRACION = '1';
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'desarrollo';
}

const archivos = readdirSync(carpetaIntegracion, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.test.js'))
  .map((entry) => path.join(carpetaIntegracion, entry.name));

const resultado = spawnSync(
  process.execPath,
  ['--test', '--test-force-exit', ...archivos],
  { stdio: 'inherit', env: process.env }
);

process.exit(resultado.status ?? 1);
