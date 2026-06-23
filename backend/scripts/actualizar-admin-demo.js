/**
 * Actualiza el hash de la cuenta demo para compatibilidad con bcrypt (Node.js).
 * Ejecutar: npm run semilla:admin
 */
import bcrypt from 'bcrypt';
import { pool } from '../src/configuracion/baseDatos.js';

const CORREO_DEMO = 'admin@lunanails.test';
const CONTRASENA_DEMO = 'Admin123!';

const hash = await bcrypt.hash(CONTRASENA_DEMO, 10);

const [resultado] = await pool.execute(
  'UPDATE usuarios SET contrasena_hash = ? WHERE correo = ?',
  [hash, CORREO_DEMO]
);

if (resultado.affectedRows === 0) {
  console.error('No se encontro el usuario demo. Importa datos_prueba.sql primero.');
  process.exit(1);
}

console.log(`Hash actualizado para ${CORREO_DEMO}`);
await pool.end();
