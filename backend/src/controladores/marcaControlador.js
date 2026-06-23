import { MarcaRepositorio } from '../repositorios/index.js';
import { MarcaServicio } from '../servicios/marcaServicio.js';
import { respuestaExito, respuestaError } from '../utilidades/respuestaJson.js';
import { slug as validarSlug } from '../utilidades/validador.js';
import { texto } from '../utilidades/sanitizador.js';

const marcaServicio = new MarcaServicio(new MarcaRepositorio());

export async function obtenerPorSlug(req, res) {
  const slugParam = texto(req.params.slug);

  const errorSlug = validarSlug(slugParam);
  if (errorSlug) {
    return respuestaError(res, errorSlug, 422);
  }

  const marca = await marcaServicio.obtenerPublicaPorSlug(slugParam);

  if (!marca) {
    return respuestaError(res, 'Marca no encontrada.', 404);
  }

  return respuestaExito(res, marca, 'Marca obtenida');
}
