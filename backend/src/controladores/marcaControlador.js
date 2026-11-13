import { MarcaRepositorio } from '../repositorios/index.js';
import { mapearMarcaPublica } from '../servicios/marcaServicio.js';
import { verificarMarcaOperativa } from '../utilidades/marcaOperativa.js';
import { cacheLecturasPublicas } from '../utilidades/cacheLecturas.js';
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

  const resultado = await cacheLecturasPublicas.obtener(`marca:${slugParam}`, async () => {
    const fila = await marcaRepo.buscarPorSlug(slugParam);
    if (!fila) return { error: 'Marca no encontrada.', codigoHttp: 404 };
    const operativa = verificarMarcaOperativa(fila);
    if (!operativa.ok) return { error: operativa.error, codigoHttp: operativa.codigoHttp };
    return { datos: mapearMarcaPublica(fila) };
  });

  if (resultado.error) {
    return respuestaError(res, resultado.error, resultado.codigoHttp ?? 404);
  }

  res.setHeader('Cache-Control', 'public, max-age=15');
  return respuestaExito(res, resultado.datos, 'Marca obtenida');
}
