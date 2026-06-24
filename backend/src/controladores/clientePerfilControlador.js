import { ClientePerfilServicio } from '../servicios/clientePerfilServicio.js';
import { respuestaExito, respuestaError } from '../utilidades/respuestaJson.js';
import { entero, texto } from '../utilidades/sanitizador.js';

const clientePerfilServicio = new ClientePerfilServicio();

export async function agregarFavoritoCliente(req, res) {
  const marcaId = entero(req.body?.marca_id ?? req.body?.marcaId);
  const telefono = texto(req.body?.telefono);
  const correo = texto(req.body?.correo);
  const tipo = texto(req.body?.tipo);
  const referenciaId = entero(req.body?.referencia_id ?? req.body?.referenciaId);

  const resultado = await clientePerfilServicio.agregarFavorito(
    marcaId,
    telefono,
    correo,
    tipo,
    referenciaId
  );

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }

  return respuestaExito(res, resultado, resultado.mensaje, 201);
}

export async function quitarFavoritoCliente(req, res) {
  const marcaId = entero(req.body?.marca_id ?? req.body?.marcaId);
  const telefono = texto(req.body?.telefono);
  const correo = texto(req.body?.correo);
  const tipo = texto(req.body?.tipo);
  const referenciaId = entero(req.body?.referencia_id ?? req.body?.referenciaId);

  const resultado = await clientePerfilServicio.quitarFavorito(
    marcaId,
    telefono,
    correo,
    tipo,
    referenciaId
  );

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }

  return respuestaExito(res, resultado, resultado.mensaje);
}
