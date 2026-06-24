import { GaleriaCatalogoRepositorio } from '../repositorios/galeriaCatalogoRepositorio.js';
import { generarSlug, slugUnico } from '../utilidades/slug.js';
import { requerido, validar } from '../utilidades/validador.js';
import { texto, entero } from '../utilidades/sanitizador.js';

const TIPOS_VALIDOS = new Set(['categoria', 'temporada']);

export function mapearItemCatalogo(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    marcaId: fila.marca_id,
    tipo: fila.tipo,
    etiqueta: fila.etiqueta,
    valor: fila.valor,
    activo: Boolean(fila.activo),
    ordenVisualizacion: fila.orden_visualizacion,
    createdAt: fila.created_at,
    updatedAt: fila.updated_at,
  };
}

export class GaleriaCatalogoServicio {
  constructor(catalogoRepo = new GaleriaCatalogoRepositorio()) {
    this.catalogoRepo = catalogoRepo;
  }

  async listarPublicos(marcaId, tipo = null) {
    const filas = await this.catalogoRepo.listarPorMarca(marcaId, { tipo, soloActivos: true });
    return filas.map(mapearItemCatalogo);
  }

  async listarAdmin(marcaId, tipo = null) {
    const filas = await this.catalogoRepo.listarPorMarca(marcaId, { tipo, soloActivos: false });
    return filas.map(mapearItemCatalogo);
  }

  async crearAdmin(marcaId, datos) {
    const parsed = await this.parsearDatos(marcaId, datos);
    if (parsed.error) return parsed;

    const id = await this.catalogoRepo.crear({ marcaId, ...parsed.datos });
    const fila = await this.catalogoRepo.buscarPorId(marcaId, id);
    return { item: mapearItemCatalogo(fila) };
  }

  async actualizarAdmin(marcaId, id, datos) {
    const existente = await this.catalogoRepo.buscarPorId(marcaId, id);
    if (!existente) return { error: 'Opcion no encontrada.', codigoHttp: 404 };

    const parsed = this.parsearDatosActualizacion(datos, existente);
    if (parsed.error) return parsed;

    await this.catalogoRepo.actualizar(marcaId, id, parsed.datos);
    const fila = await this.catalogoRepo.buscarPorId(marcaId, id);
    return { item: mapearItemCatalogo(fila) };
  }

  async eliminarAdmin(marcaId, id) {
    const existente = await this.catalogoRepo.buscarPorId(marcaId, id);
    if (!existente) return { error: 'Opcion no encontrada.', codigoHttp: 404 };

    const enUso = await this.catalogoRepo.contarDisenosConValor(
      marcaId,
      existente.tipo,
      existente.valor
    );

    if (enUso > 0) {
      return {
        error: `No se puede eliminar: ${enUso} diseno(s) la usan. Desactivala en su lugar.`,
        codigoHttp: 409,
      };
    }

    await this.catalogoRepo.eliminar(marcaId, id);
    return { ok: true };
  }

  async validarValorCatalogo(marcaId, tipo, valor, { requerido: esRequerido = false } = {}) {
    if (!valor) {
      if (esRequerido) {
        return { error: `Debe seleccionar una ${tipo === 'categoria' ? 'categoria' : 'temporada'}.`, codigoHttp: 422 };
      }
      return { ok: true };
    }

    const item = await this.catalogoRepo.buscarPorValor(marcaId, tipo, valor);
    if (!item || !item.activo) {
      return {
        error: `La ${tipo === 'categoria' ? 'categoria' : 'temporada'} seleccionada no es valida.`,
        codigoHttp: 422,
      };
    }

    return { ok: true };
  }

  async parsearDatos(marcaId, datos) {
    const tipo = texto(datos.tipo);
    const etiqueta = texto(datos.etiqueta, { capitalizar: 'palabras' });

    const errores = validar(
      { tipo, etiqueta },
      {
        tipo: (v) => (TIPOS_VALIDOS.has(v) ? null : 'Tipo invalido.'),
        etiqueta: (v) => requerido(v, 'nombre'),
      }
    );

    if (Object.keys(errores).length > 0) {
      return { error: 'Datos invalidos.', errores, codigoHttp: 422 };
    }

    const baseSlug = generarSlug(etiqueta) || tipo;
    const valor = await slugUnico(baseSlug, (candidato) =>
      this.catalogoRepo.valorExiste(marcaId, tipo, candidato)
    );

    const activo = datos.activo !== undefined ? Boolean(datos.activo) : true;
    const ordenVisualizacion = entero(datos.orden_visualizacion ?? datos.ordenVisualizacion ?? 0) ?? 0;

    return {
      datos: {
        tipo,
        etiqueta,
        valor,
        activo,
        ordenVisualizacion,
      },
    };
  }

  parsearDatosActualizacion(datos, existente) {
    const etiqueta = texto(datos.etiqueta ?? existente.etiqueta, { capitalizar: 'palabras' });
    const activo = datos.activo !== undefined ? Boolean(datos.activo) : Boolean(existente.activo);
    const ordenVisualizacion = entero(
      datos.orden_visualizacion ?? datos.ordenVisualizacion ?? existente.orden_visualizacion ?? 0
    ) ?? 0;

    const errores = validar(
      { etiqueta },
      { etiqueta: (v) => requerido(v, 'nombre') }
    );

    if (Object.keys(errores).length > 0) {
      return { error: 'Datos invalidos.', errores, codigoHttp: 422 };
    }

    return {
      datos: {
        etiqueta,
        activo,
        ordenVisualizacion,
      },
    };
  }
}
