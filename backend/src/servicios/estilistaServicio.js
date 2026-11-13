import { EstilistaRepositorio } from '../repositorios/estilistaRepositorio.js';
import { GaleriaRepositorio } from '../repositorios/galeriaRepositorio.js';
import { requerido, validar } from '../utilidades/validador.js';
import { entero, texto } from '../utilidades/sanitizador.js';
import { cacheLecturasPublicas } from '../utilidades/cacheLecturas.js';
import { normalizarRutaMediaAlmacenamiento, resolverRutaMedia } from '../utilidades/resolverRutaMedia.js';

const MAX_TRABAJOS = 6;
const MAX_HABILIDADES = 8;

export function partirHabilidades(valor) {
  if (!valor) return [];
  return String(valor)
    .split(',')
    .map((item) => texto(item, { capitalizar: 'inicio' }))
    .filter(Boolean)
    .slice(0, MAX_HABILIDADES);
}

function guardarHabilidades(valor, existente) {
  if (valor === undefined) return existente ?? null;
  const unido = partirHabilidades(Array.isArray(valor) ? valor.join(',') : valor).join(', ');
  return unido ? unido.slice(0, 280) : null;
}

function guardarDescripcion(datos, existente) {
  if (datos.descripcion === undefined) return existente ?? null;
  const limpio = texto(datos.descripcion, { capitalizar: 'inicio' }).slice(0, 280);
  return limpio || null;
}

function guardarFoto(datos, existente) {
  const crudo = datos.foto_ruta ?? datos.fotoRuta ?? datos.foto;
  if (crudo === undefined) return existente ?? null;
  if (crudo === null || String(crudo).trim() === '') return null;
  return normalizarRutaMediaAlmacenamiento(texto(crudo)) || null;
}

export function mapearEstilista(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    marcaId: fila.marca_id,
    nombre: fila.nombre,
    foto: resolverRutaMedia(fila.foto_ruta) || null,
    habilidades: partirHabilidades(fila.habilidades),
    descripcion: fila.descripcion || null,
    activo: Boolean(fila.activo),
    ordenVisualizacion: fila.orden_visualizacion,
  };
}

export class EstilistaServicio {
  constructor(
    estilistaRepo = new EstilistaRepositorio(),
    galeriaRepo = new GaleriaRepositorio()
  ) {
    this.estilistaRepo = estilistaRepo;
    this.galeriaRepo = galeriaRepo;
  }

  async listarPublicos(marcaId) {
    return cacheLecturasPublicas.obtener(`estilistas:${marcaId}`, async () => {
      const filas = await this.estilistaRepo.listarActivos(marcaId);
      return filas.map(mapearEstilista);
    });
  }

  async listarPortafolio(marcaId) {
    const [filas, trabajos] = await Promise.all([
      this.estilistaRepo.listarActivos(marcaId),
      this.galeriaRepo.listarActivosConEstilista(marcaId),
    ]);
    const porEstilista = new Map();
    for (const trabajo of trabajos) {
      const lista = porEstilista.get(trabajo.estilista_id) ?? [];
      if (lista.length >= MAX_TRABAJOS) continue;
      lista.push({
        id: trabajo.id,
        titulo: trabajo.titulo,
        imagen: resolverRutaMedia(trabajo.imagen_ruta),
      });
      porEstilista.set(trabajo.estilista_id, lista);
    }
    return filas.map((fila) => ({
      ...mapearEstilista(fila),
      trabajos: porEstilista.get(fila.id) ?? [],
    }));
  }

  async listarAdmin(marcaId) {
    const filas = await this.estilistaRepo.listarPorMarca(marcaId);
    return filas.map(mapearEstilista);
  }

  async crearAdmin(marcaId, datos) {
    const nombre = texto(datos.nombre, { capitalizar: 'palabras' });
    const errores = validar(
      { nombre },
      { nombre: (v) => requerido(v, 'nombre') }
    );
    if (Object.keys(errores).length > 0) {
      return { error: 'Datos invalidos.', errores, codigoHttp: 422 };
    }

    const id = await this.estilistaRepo.crear({
      marcaId,
      nombre,
      fotoRuta: guardarFoto(datos, null),
      habilidades: guardarHabilidades(datos.habilidades, null),
      descripcion: guardarDescripcion(datos, null),
      ordenVisualizacion: entero(datos.orden_visualizacion ?? datos.ordenVisualizacion) ?? 0,
    });
    const fila = await this.estilistaRepo.buscarPorId(marcaId, id);
    return { estilista: mapearEstilista(fila) };
  }

  async actualizarAdmin(marcaId, id, datos) {
    const existente = await this.estilistaRepo.buscarPorId(marcaId, id);
    if (!existente) return { error: 'Estilista no encontrada.', codigoHttp: 404 };

    const nombre = texto(datos.nombre ?? existente.nombre, { capitalizar: 'palabras' });
    const activo = datos.activo !== undefined ? Boolean(datos.activo) : Boolean(existente.activo);
    const ordenVisualizacion = entero(
      datos.orden_visualizacion ?? datos.ordenVisualizacion ?? existente.orden_visualizacion
    ) ?? 0;

    const errores = validar(
      { nombre },
      { nombre: (v) => requerido(v, 'nombre') }
    );
    if (Object.keys(errores).length > 0) {
      return { error: 'Datos invalidos.', errores, codigoHttp: 422 };
    }

    await this.estilistaRepo.actualizar(marcaId, id, {
      nombre,
      fotoRuta: guardarFoto(datos, existente.foto_ruta),
      habilidades: guardarHabilidades(datos.habilidades, existente.habilidades),
      descripcion: guardarDescripcion(datos, existente.descripcion),
      activo,
      ordenVisualizacion,
    });
    const fila = await this.estilistaRepo.buscarPorId(marcaId, id);
    return { estilista: mapearEstilista(fila) };
  }
}
