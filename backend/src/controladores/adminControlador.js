import { respuestaError } from '../utilidades/respuestaJson.js';

export function adminPendiente(mensaje) {
  return (req, res) => respuestaError(res, mensaje, 501);
}
