import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { CopiaMarcaRepositorio, ErrorCopia } from '../repositorios/copiaMarcaRepositorio.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIRECTORIO = path.resolve(__dirname, '../../almacen/copias');
const ARCHIVO = /^copia-\d+-\d+\.json$/;
const COPIAS_POR_EMPRESA = 8;
const SEMANA_MS = 7 * 24 * 60 * 60 * 1000;
const FILAS_MAXIMAS = 20000;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function resumir(archivo, documento, existen) {
  const marcaId = Number(documento.marcaId);
  return {
    archivo,
    guardadaEn: documento.guardadaEn,
    marcaId,
    nombre: documento.nombre,
    slug: documento.slug,
    existeMarca: existen.has(marcaId),
    clientes: Array.isArray(documento.tablas?.clientes) ? documento.tablas.clientes.length : 0,
    citas: Array.isArray(documento.tablas?.citas) ? documento.tablas.citas.length : 0,
    origen: documento.origen === 'automatica' ? 'automatica' : 'manual',
  };
}

export class CopiaMarcaServicio {
  constructor(repo = new CopiaMarcaRepositorio()) {
    this.repo = repo;
  }

  async guardar(marcaId, origen = 'manual') {
    try {
      const cruda = await this.repo.exportar(marcaId);
      if (!cruda) return { error: 'Marca no encontrada.', codigoHttp: 404 };
      const copia = await this.#escribir(cruda, origen);
      return { copia };
    } catch (error) {
      return this.#error(error);
    }
  }

  async guardarSemanales(soloMarcaId = null) {
    const ids = soloMarcaId ? [Number(soloMarcaId)] : await this.repo.listarIds();
    const documentos = await this.#leerTodas();
    let guardadas = 0;

    for (const marcaId of ids) {
      const ultima = documentos
        .filter((item) => Number(item.documento.marcaId) === marcaId && item.documento.origen === 'automatica')
        .sort((a, b) => String(b.documento.guardadaEn).localeCompare(String(a.documento.guardadaEn)))[0];
      const reciente = ultima && Date.now() - new Date(ultima.documento.guardadaEn).getTime() < SEMANA_MS;
      if (reciente) continue;

      const resultado = await this.guardar(marcaId, 'automatica');
      if (resultado.error) {
        console.error(`[copias] Marca ${marcaId}: ${resultado.error}`);
        continue;
      }
      guardadas += 1;
    }

    return { revisadas: ids.length, guardadas };
  }

  async guardarDocumento(texto) {
    let documento;
    try {
      documento = JSON.parse(texto);
    } catch {
      return { error: 'El archivo no es una copia válida. No se cambió nada.', codigoHttp: 422 };
    }

    const validado = this.#validar(documento);
    if (validado.error) return validado;

    try {
      const copia = await this.#escribir(validado.documento);
      return { copia };
    } catch (error) {
      return this.#error(error);
    }
  }

  async listar(marcaId = null) {
    const documentos = await this.#leerTodas();
    const existen = await this.repo.idsExistentes(documentos.map((item) => item.documento.marcaId));
    return documentos
      .map((item) => resumir(item.archivo, item.documento, existen))
      .filter((copia) => (marcaId ? copia.marcaId === marcaId : true))
      .sort((a, b) => String(b.guardadaEn).localeCompare(String(a.guardadaEn)));
  }

  rutaDescarga(archivo) {
    return this.#ruta(archivo);
  }

  async eliminar(archivo) {
    const ruta = this.#ruta(archivo);
    const marcaId = this.#marcaDelArchivo(archivo);
    if (!ruta || !marcaId) return { error: 'Copia no encontrada.', codigoHttp: 404 };

    try {
      await fs.access(ruta);
    } catch {
      return { error: 'Copia no encontrada.', codigoHttp: 404 };
    }

    const existen = await this.repo.idsExistentes([marcaId]);
    if (existen.has(marcaId)) {
      return {
        error: 'Esta copia es de una empresa que sigue en la plataforma. No se borró.',
        codigoHttp: 409,
      };
    }

    await fs.unlink(ruta);
    return { eliminada: true, archivo };
  }

  async restaurar(archivo, marcaIdForzada = null) {
    const ruta = this.#ruta(archivo);
    if (!ruta) return { error: 'Copia no encontrada.', codigoHttp: 404 };

    let documento;
    try {
      documento = JSON.parse(await fs.readFile(ruta, 'utf8'));
    } catch {
      return { error: 'Copia no encontrada.', codigoHttp: 404 };
    }

    const validado = this.#validar(documento);
    if (validado.error) return validado;

    try {
      const resultado = await this.repo.restaurar(validado.documento, marcaIdForzada);
      if (resultado.error) return resultado;
      return { restauracion: resultado };
    } catch (error) {
      return this.#error(error);
    }
  }

  #validar(documento) {
    if (!documento || documento.version !== 1 || !documento.marca || typeof documento.tablas !== 'object') {
      return { error: 'El archivo no es una copia de una empresa. No se cambió nada.', codigoHttp: 422 };
    }

    const marca = documento.marca;
    const marcaId = Number(marca.id);
    const slug = String(marca.slug ?? '');
    const nombre = String(marca.nombre_comercial ?? '').trim();
    if (!Number.isInteger(marcaId) || marcaId <= 0 || !nombre || nombre.length > 150 || !SLUG.test(slug) || slug.length > 100) {
      return { error: 'La copia no identifica a una sola empresa. No se cambió nada.', codigoHttp: 422 };
    }

    let total = 0;
    for (const filas of Object.values(documento.tablas)) {
      if (!Array.isArray(filas)) {
        return { error: 'El archivo no es una copia de una empresa. No se cambió nada.', codigoHttp: 422 };
      }
      total += filas.length;
      for (const fila of filas) {
        if (!fila || typeof fila !== 'object') {
          return { error: 'El archivo no es una copia de una empresa. No se cambió nada.', codigoHttp: 422 };
        }
        if (fila.marca_id != null && Number(fila.marca_id) !== marcaId) {
          return { error: 'La copia mezcla empresas. No se cambió nada.', codigoHttp: 409 };
        }
      }
    }
    if (total > FILAS_MAXIMAS) {
      return { error: 'La copia es demasiado grande. No se cambió nada.', codigoHttp: 422 };
    }

    return {
      documento: {
        version: 1,
        marcaId,
        slug,
        nombre,
        marca,
        tablas: documento.tablas,
        publicidadPublicacion: Array.isArray(documento.publicidadPublicacion) ? documento.publicidadPublicacion : [],
      },
    };
  }

  async #escribir(cruda, origen = 'manual') {
    const validado = this.#validar({ version: 1, ...cruda, marca: cruda.marca });
    if (validado.error) throw new ErrorCopia(validado.error, validado.codigoHttp);

    const documento = {
      ...validado.documento,
      guardadaEn: new Date().toISOString(),
      origen: origen === 'automatica' ? 'automatica' : 'manual',
    };
    await fs.mkdir(DIRECTORIO, { recursive: true });
    const archivo = `copia-${documento.marcaId}-${Date.now()}.json`;
    const ruta = this.#ruta(archivo);
    const temporal = `${ruta}.tmp`;
    await fs.writeFile(temporal, JSON.stringify(documento), 'utf8');
    await fs.rename(temporal, ruta);
    await this.#recortar(documento.marcaId);
    const existen = await this.repo.idsExistentes([documento.marcaId]);
    return resumir(archivo, documento, existen);
  }

  async #recortar(marcaId) {
    const propias = (await this.#leerTodas()).filter((item) => Number(item.documento.marcaId) === marcaId);
    await this.#borrarSobrantes(propias.filter((item) => item.documento.origen === 'automatica'));
    await this.#borrarSobrantes(propias.filter((item) => item.documento.origen !== 'automatica'));
  }

  async #borrarSobrantes(items) {
    const ordenadas = [...items].sort((a, b) => String(b.documento.guardadaEn).localeCompare(String(a.documento.guardadaEn)));
    await Promise.all(
      ordenadas.slice(COPIAS_POR_EMPRESA).map((item) => fs.unlink(path.join(DIRECTORIO, item.archivo)).catch(() => {}))
    );
  }

  async #leerTodas() {
    let nombres = [];
    try {
      nombres = await fs.readdir(DIRECTORIO);
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }

    const documentos = [];
    for (const archivo of nombres) {
      if (!ARCHIVO.test(archivo)) continue;
      try {
        const documento = JSON.parse(await fs.readFile(path.join(DIRECTORIO, archivo), 'utf8'));
        if (documento?.version === 1) documentos.push({ archivo, documento });
      } catch {
        // Un archivo dañado no bloquea la lista.
      }
    }
    return documentos;
  }

  #marcaDelArchivo(archivo) {
    const coincidencia = String(archivo ?? '').match(/^copia-(\d+)-\d+\.json$/);
    const marcaId = Number(coincidencia?.[1]);
    if (!Number.isInteger(marcaId) || marcaId <= 0) return null;
    return marcaId;
  }

  #ruta(archivo) {
    if (!ARCHIVO.test(String(archivo ?? ''))) return null;
    const base = path.resolve(DIRECTORIO);
    const ruta = path.resolve(base, archivo);
    if (!ruta.toLowerCase().startsWith(`${base.toLowerCase()}${path.sep}`)) return null;
    return ruta;
  }

  #error(error) {
    if (error.esCopia) return { error: error.message, codigoHttp: error.codigoHttp };
    throw error;
  }
}

export const copiaMarcaServicio = new CopiaMarcaServicio();
