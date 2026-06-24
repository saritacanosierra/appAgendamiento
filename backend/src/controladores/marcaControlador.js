import { MarcaRepositorio } from '../repositorios/index.js';
import { mapearMarcaPublica } from '../servicios/marcaServicio.js';
import { verificarMarcaOperativa } from '../utilidades/marcaOperativa.js';
import { respuestaExito, respuestaError } from '../utilidades/respuestaJson.js';
import { slug as validarSlug } from '../utilidades/validador.js';
import { texto } from '../utilidades/sanitizador.js';

const marcaRepo = new MarcaRepositorio();

export async function obtenerPorSlug(req, res) {
  const slugParam = texto(req.params.slug);

  const errorSlug = validarSlug(slugParam);
  if (errorSlug) {
    return respuestaError(res, errorSlug, 422);
  }

  const fila = await marcaRepo.buscarPorSlug(slugParam);

  if (!fila) {
    return respuestaError(res, 'Marca no encontrada.', 404);
  }

  const operativa = verificarMarcaOperativa(fila);
  if (!operativa.ok) {
    return respuestaError(res, operativa.error, operativa.codigoHttp);
  }

  const marca = mapearMarcaPublica(fila);
  return respuestaExito(res, marca, 'Marca obtenida');
}
