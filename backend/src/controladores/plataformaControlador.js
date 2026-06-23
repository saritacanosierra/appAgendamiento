import { plataformaServicio } from '../servicios/plataformaServicio.js';
import { reporteServicio } from '../servicios/reporteServicio.js';
import { respuestaExito, respuestaError } from '../utilidades/respuestaJson.js';

export async function listarMarcasPlataforma(req, res) {
  const marcas = await plataformaServicio.listarMarcas();
  return respuestaExito(res, { marcas }, 'Marcas registradas');
}

export async function obtenerMarcaPlataforma(req, res) {
  const marcaId = Number(req.params.id);
  const resultado = await plataformaServicio.obtenerMarca(marcaId);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 404);
  }

  return respuestaExito(res, resultado, 'Detalle de marca');
}

export async function obtenerResumenPlataforma(req, res) {
  const resumen = await plataformaServicio.obtenerResumen();
  return respuestaExito(res, resumen, 'Resumen de plataforma');
}

export async function crearMarcaPlataforma(req, res) {
  const resultado = await plataformaServicio.crearMarca(req.body);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }

  return respuestaExito(res, resultado, 'Marca creada', 201);
}

export async function actualizarMarcaPlataforma(req, res) {
  const marcaId = Number(req.params.id);
  const resultado = await plataformaServicio.actualizarMarca(marcaId, req.body);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }

  return respuestaExito(res, resultado, 'Marca actualizada');
}

export async function impersonarMarcaPlataforma(req, res) {
  const marcaId = Number(req.params.id);
  const resultado = await plataformaServicio.impersonarMarca(marcaId);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400);
  }

  return respuestaExito(res, resultado, 'Sesion de marca iniciada');
}

export async function obtenerReportePlataforma(req, res) {
  const { desde, hasta } = req.query;
  const reporte = await reporteServicio.obtenerReportePlataforma(desde, hasta);

  if (reporte.error) {
    return respuestaError(res, reporte.error, reporte.codigoHttp ?? 422);
  }

  return respuestaExito(res, reporte, 'Reporte global de plataforma');
}

export async function resetearContrasenaMarcaPlataforma(req, res) {
  const marcaId = Number(req.params.id);
  const nuevaContrasena = req.body?.nueva_contrasena ?? req.body?.nuevaContrasena;
  const resultado = await plataformaServicio.resetearContrasenaAdmin(marcaId, nuevaContrasena);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }

  return respuestaExito(res, resultado, 'Contrasena del admin actualizada');
}
