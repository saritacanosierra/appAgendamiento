import { entorno } from '../configuracion/entorno.js';
import { verificarConexion } from '../configuracion/baseDatos.js';
import { respuestaExito } from '../utilidades/respuestaJson.js';
import { formatear, ahora } from '../utilidades/fechaHora.js';

export async function estado(req, res) {
  let baseDatos = { conectada: false, mensaje: 'Sin verificar' };

  try {
    baseDatos = await verificarConexion();
  } catch (err) {
    baseDatos = { conectada: false, mensaje: `No conectada: ${err.message}` };
  }

  return respuestaExito(res, {
    aplicacion: 'Spa Unas API',
    version: '1.0.0-fase2-node',
    entorno: entorno.nodeEnv,
    runtime: 'Node.js',
    fecha_servidor: formatear(ahora()),
    base_datos: baseDatos,
  }, 'API operativa');
}
