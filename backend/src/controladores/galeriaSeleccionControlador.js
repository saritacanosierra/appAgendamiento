import { GaleriaSeleccionServicio } from '../servicios/galeriaSeleccionServicio.js';
import { respuestaExito, respuestaError } from '../utilidades/respuestaJson.js';
import { entero, texto } from '../utilidades/sanitizador.js';

const galeriaSeleccionServicio = new GaleriaSeleccionServicio();

export async function iniciarSesionGaleria(req, res) {
  const marcaId = entero(req.params.marca_id);
  const telefono = texto(req.body?.telefono);

  const resultado = await galeriaSeleccionServicio.iniciarSesion(marcaId, telefono);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }

  return respuestaExito(res, resultado, 'Sesion de galeria iniciada');
}

export async function listarSeleccionesGaleria(req, res) {
  const marcaId = entero(req.params.marca_id);
  const citaId = entero(req.query.cita_id ?? req.query.citaId);
  const telefono = texto(req.query.telefono);

  const resultado = await galeriaSeleccionServicio.listarSelecciones(marcaId, citaId, telefono);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }

  return respuestaExito(res, resultado, 'Seleccion de disenos');
}

export async function agregarSeleccionGaleria(req, res) {
  const marcaId = entero(req.params.marca_id);
  const citaId = entero(req.body?.cita_id ?? req.body?.citaId);
  const disenoId = entero(req.body?.diseno_id ?? req.body?.disenoId);
  const telefono = texto(req.body?.telefono);

  const resultado = await galeriaSeleccionServicio.agregarSeleccion(
    marcaId,
    citaId,
    disenoId,
    telefono
  );

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }

  return respuestaExito(res, resultado, resultado.mensaje, 201);
}

export async function quitarSeleccionGaleria(req, res) {
  const marcaId = entero(req.params.marca_id);
  const citaId = entero(req.body?.cita_id ?? req.body?.citaId);
  const disenoId = entero(req.body?.diseno_id ?? req.body?.disenoId);
  const telefono = texto(req.body?.telefono);

  const resultado = await galeriaSeleccionServicio.quitarSeleccion(
    marcaId,
    citaId,
    disenoId,
    telefono
  );

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }

  return respuestaExito(res, resultado, resultado.mensaje);
}
