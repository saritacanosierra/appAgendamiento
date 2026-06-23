import mysql from 'mysql2/promise';
import { baseDatos } from './entorno.js';

/** Pool de conexiones MySQL con prepared statements. */
export const pool = mysql.createPool(baseDatos);

export async function verificarConexion() {
  const conexion = await pool.getConnection();
  try {
    await conexion.query('SELECT 1');
    return { conectada: true, mensaje: 'Conexion exitosa' };
  } finally {
    conexion.release();
  }
}
