import { AdminCitaServicio, AdminClienteServicio } from '../servicios/adminCitaServicio.js';
import { respuestaExito, respuestaError } from '../utilidades/respuestaJson.js';
import { entero, texto } from '../utilidades/sanitizador.js';

const citaServicio = new AdminCitaServicio();

export async function listarCitas(req, res) {
  const fecha = texto(req.query.fecha) || undefined;
  const estado = texto(req.query.estado) || undefined;

  const citas = await citaServicio.listarCitas(req.marcaId, { fecha, estado });
  return respuestaExito(res, citas, 'Citas de la marca');
}

export async function obtenerAgenda(req, res) {
  const fecha = texto(req.query.fecha) || new Date().toISOString().slice(0, 10);
  const vista = texto(req.query.vista) || 'dia';

  const resultado = await citaServicio.obtenerAgenda(req.marcaId, fecha, vista);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400);
  }

  return respuestaExito(res, resultado, 'Agenda obtenida');
}

export async function crearCitaAdmin(req, res) {
  const resultado = await citaServicio.crearCitaAdmin(req.marcaId, req.body);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }

  return respuestaExito(res, resultado.cita, 'Cita creada', 201);
}

export async function actualizarCitaAdmin(req, res) {
  const citaId = entero(req.params.id);
  if (!citaId) return respuestaError(res, 'ID invalido.', 422);

  const resultado = await citaServicio.actualizarCita(req.marcaId, citaId, req.body);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }

  return respuestaExito(res, resultado.cita, 'Cita actualizada');
}

export async function eliminarCitaAdmin(req, res) {
  const citaId = entero(req.params.id);
  if (!citaId) return respuestaError(res, 'ID invalido.', 422);

  const resultado = await citaServicio.cancelarCita(req.marcaId, citaId);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400);
  }

  return respuestaExito(res, resultado.cita, 'Cita cancelada');
}

const clienteServicio = new AdminClienteServicio();

export async function listarClientes(req, res) {
  const busqueda = texto(req.query.busqueda) || '';
  const clientes = await clienteServicio.listar(req.marcaId, busqueda);
  return respuestaExito(res, clientes, 'Clientes de la marca');
}

export async function crearCliente(req, res) {
  const resultado = await clienteServicio.crear(req.marcaId, req.body);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }

  return respuestaExito(res, resultado.cliente, 'Cliente registrado', 201);
}
