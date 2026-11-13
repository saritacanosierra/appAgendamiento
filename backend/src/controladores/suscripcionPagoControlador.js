import { wompiServicio } from '../servicios/wompiServicio.js';
import { suscripcionMarcaServicio } from '../servicios/suscripcionMarcaServicio.js';
import { listarPlanesCobro, PRECIO_MES_COP } from '../utilidades/suscripcionMarca.js';
import { respuestaExito, respuestaError } from '../utilidades/respuestaJson.js';

export async function obtenerPlanMarca(req, res) {
  const fila = await suscripcionMarcaServicio.marcaRepo.buscarPorId(req.marcaId);
  if (!fila) return respuestaError(res, 'Marca no encontrada.', 404);

  const { mapearEstadoSuscripcion } = await import('../utilidades/suscripcionMarca.js');
  return respuestaExito(res, {
    plan: mapearEstadoSuscripcion(fila),
    precioMensual: PRECIO_MES_COP,
    planes: listarPlanesCobro(),
    wompiConfigurado: wompiServicio.configurado(),
  }, 'Plan de la marca');
}

export async function crearPagoWompi(req, res) {
  const resultado = await wompiServicio.crearIntento(
    req.marcaId,
    req.body?.plan_tipo ?? req.body?.planTipo
  );
  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400);
  }
  return respuestaExito(res, resultado, 'Pago listo para Wompi');
}

export async function webhookWompi(req, res) {
  const resultado = await wompiServicio.confirmarEvento(req.body ?? {});
  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400);
  }
  return respuestaExito(res, resultado, 'Evento recibido');
}
