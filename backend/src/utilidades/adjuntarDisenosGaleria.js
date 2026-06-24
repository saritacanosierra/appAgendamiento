import { CitaDisenosGaleriaRepositorio } from '../repositorios/citaDisenosGaleriaRepositorio.js';

function mapearDisenoGaleriaCita(fila) {
  return {
    id: Number(fila.diseno_id),
    titulo: fila.titulo,
    imagenRuta: fila.imagen_ruta,
    categoria: fila.categoria ?? null,
    temporada: fila.temporada ?? null,
    seleccionadoAt: fila.created_at ?? null,
  };
}

export async function adjuntarDisenosGaleriaACitas(citas, marcaId, repo = new CitaDisenosGaleriaRepositorio()) {
  if (!Array.isArray(citas) || citas.length === 0) return citas;

  const citaIds = [...new Set(citas.map((c) => c.id).filter(Boolean))];
  const filas = await repo.listarPorCitas(marcaId, citaIds);
  const porCita = new Map();

  for (const fila of filas) {
    const citaId = Number(fila.cita_id);
    if (!porCita.has(citaId)) porCita.set(citaId, []);
    porCita.get(citaId).push(mapearDisenoGaleriaCita(fila));
  }

  return citas.map((cita) => ({
    ...cita,
    disenosGaleria: porCita.get(cita.id) ?? [],
  }));
}
