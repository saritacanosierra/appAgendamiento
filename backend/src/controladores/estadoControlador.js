import { entorno } from '../configuracion/entorno.js';
import { verificarConexion } from '../configuracion/baseDatos.js';
import { respuestaExito } from '../utilidades/respuestaJson.js';
import { formatear, ahora } from '../utilidades/fechaHora.js';

export async function estado(req, res) {
  const esProduccion = entorno.nodeEnv === 'produccion';

  if (esProduccion) {
    let operativa = false;
    try {
      const bd = await verificarConexion();
      operativa = Boolean(bd.conectada);
    } catch {
      operativa = false;
    }

    return respuestaExito(res, {
      aplicacion: 'Spa Unas API',
      version: '1.0.0-fase2-node',
      operativa,
    }, operativa ? 'API operativa' : 'API con problemas');
  }

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
