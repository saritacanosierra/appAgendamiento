import { GaleriaServicio } from '../servicios/galeriaServicio.js';
import { MarcaRepositorio } from '../repositorios/index.js';
import { respuestaExito, respuestaError } from '../utilidades/respuestaJson.js';
import { entero } from '../utilidades/sanitizador.js';

const galeriaServicio = new GaleriaServicio();
const marcaRepo = new MarcaRepositorio();

async function verificarMarcaPublica(marcaId, res) {
  const id = entero(marcaId);
  if (!id) {
    respuestaError(res, 'ID de marca invalido.', 422);
    return null;
  }

  const marca = await marcaRepo.buscarPorId(id);
  if (!marca) {
    respuestaError(res, 'Marca no encontrada.', 404);
    return null;
  }

  return id;
}

export async function listarPublicos(req, res) {
  const marcaId = await verificarMarcaPublica(req.params.marca_id, res);
  if (!marcaId) return;

  const disenos = await galeriaServicio.listarPublicos(marcaId);
  return respuestaExito(res, disenos, 'Galeria obtenida');
}

export async function listarAdmin(req, res) {
  const disenos = await galeriaServicio.listarAdmin(req.marcaId);
  return respuestaExito(res, disenos, 'Disenos de la marca');
}

export async function crearAdmin(req, res) {
  const resultado = await galeriaServicio.crearAdmin(req.marcaId, req.body);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }

  return respuestaExito(res, resultado.diseno, 'Diseno creado', 201);
}

export async function actualizarAdmin(req, res) {
  const id = entero(req.params.id);
  if (!id) return respuestaError(res, 'ID invalido.', 422);

  const resultado = await galeriaServicio.actualizarAdmin(req.marcaId, id, req.body);

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 400, resultado.errores);
  }

  return respuestaExito(res, resultado.diseno, 'Diseno actualizado');
}
