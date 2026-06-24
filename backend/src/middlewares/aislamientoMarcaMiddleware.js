import { respuestaError } from '../utilidades/respuestaJson.js';

function extraerMarcaIdSolicitud(req) {
  const candidatos = [
    req.body?.marca_id,
    req.body?.marcaId,
    req.query?.marca_id,
    req.query?.marcaId,
    req.params?.marca_id,
    req.params?.marcaId,
  ];

  for (const valor of candidatos) {
    if (valor !== undefined && valor !== null && valor !== '') {
      const numero = Number(valor);
      if (Number.isFinite(numero) && numero > 0) {
        return numero;
      }
    }
  }

  return null;
}

/**
 * Impide suplantar otra marca enviando marca_id distinto al de la sesion.
 */
export function aislamientoMarcaMiddleware(req, res, next) {
  const marcaSesion = Number(req.marcaId);
  if (!marcaSesion) {
    return respuestaError(res, 'Acceso denegado.', 403);
  }

  const marcaSolicitada = extraerMarcaIdSolicitud(req);
  if (marcaSolicitada && marcaSolicitada !== marcaSesion) {
    return respuestaError(res, 'Acceso denegado.', 403);
  }

  next();
}
