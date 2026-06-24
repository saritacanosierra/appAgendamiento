/**
 * Crea o actualiza el superadmin de plataforma (cuenta unica del operador SaaS).
 * Uso: npm run semilla:superadmin
 *
 * Variables opcionales en backend/.env:
 *   SUPERADMIN_CORREO, SUPERADMIN_CONTRASENA, SUPERADMIN_NOMBRE
 */
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { pool } from '../src/configuracion/baseDatos.js';

dotenv.config();

const CORREO = process.env.SUPERADMIN_CORREO ?? 'saritacanosierra@gmail.com';
const CONTRASENA = process.env.SUPERADMIN_CONTRASENA ?? '123456789';
const NOMBRE = process.env.SUPERADMIN_NOMBRE ?? 'Operador Plataforma';

async function main() {
  const hash = await bcrypt.hash(CONTRASENA, 10);

  const [existentes] = await pool.execute(
    'SELECT id, rol FROM usuarios WHERE correo = ? LIMIT 1',
    [CORREO]
  );

  if (existentes[0]) {
    await pool.execute(
      `UPDATE usuarios
       SET nombre = ?, contrasena_hash = ?, rol = 'superadmin', marca_id = NULL, activo = 1
       WHERE id = ?`,
      [NOMBRE, hash, existentes[0].id]
    );
    console.log('Superadmin actualizado:', CORREO);
  } else {
    await pool.execute(
      `INSERT INTO usuarios (marca_id, nombre, correo, contrasena_hash, rol, activo)
       VALUES (NULL, ?, ?, ?, 'superadmin', 1)`,
      [NOMBRE, CORREO, hash]
    );
    console.log('Superadmin creado:', CORREO);
  }

  console.log('  Panel: http://localhost:5173/plataforma/');
  console.log('  (La contrasena no se muestra en consola por seguridad.)');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
