/**
 * Crea usuario superadmin de plataforma si no existe.
 * Uso: npm run semilla:superadmin
 */
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { pool } from '../src/configuracion/baseDatos.js';

dotenv.config();

const CORREO = 'platform@spa-unas.test';
const CONTRASENA = 'Platform123!';
const NOMBRE = 'Administrador Plataforma';

async function main() {
  const [existentes] = await pool.execute(
    'SELECT id FROM usuarios WHERE correo = ? LIMIT 1',
    [CORREO]
  );

  if (existentes[0]) {
    console.log('Superadmin ya existe:', CORREO);
    process.exit(0);
  }

  const hash = await bcrypt.hash(CONTRASENA, 10);
  await pool.execute(
    `INSERT INTO usuarios (marca_id, nombre, correo, contrasena_hash, rol, activo)
     VALUES (NULL, ?, ?, ?, 'superadmin', 1)`,
    [NOMBRE, CORREO, hash]
  );

  console.log('Superadmin creado:');
  console.log('  Correo:', CORREO);
  console.log('  Contrasena:', CONTRASENA);
  console.log('  Panel: http://localhost:5173/plataforma/marcas');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
