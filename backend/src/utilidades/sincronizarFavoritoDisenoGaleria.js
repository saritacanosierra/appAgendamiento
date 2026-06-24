import { ClienteFavoritosRepositorio } from '../repositorios/clienteFavoritosRepositorio.js';
import { CitaDisenosGaleriaRepositorio } from '../repositorios/citaDisenosGaleriaRepositorio.js';

const TIPO_DISENO = 'diseno_galeria';

export async function sincronizarFavoritosDesdeDisenosCita(
  marcaId,
  clienteId,
  citaIds,
  deps = {}
) {
  const seleccionRepo = deps.seleccionRepo ?? new CitaDisenosGaleriaRepositorio();
  const favoritosRepo = deps.favoritosRepo ?? new ClienteFavoritosRepositorio();

  const filas = await seleccionRepo.listarPorCitas(marcaId, citaIds);
  const disenosUnicos = [...new Set(filas.map((f) => Number(f.diseno_id)).filter(Boolean))];

  for (const disenoId of disenosUnicos) {
    const existe = await favoritosRepo.existe(marcaId, clienteId, TIPO_DISENO, disenoId);
    if (!existe) {
      await favoritosRepo.agregar({
        marcaId,
        clienteId,
        tipo: TIPO_DISENO,
        referenciaId: disenoId,
      });
    }
  }
}

export async function agregarFavoritoDisenoPorTelefono(
  marcaId,
  telefono,
  disenoId,
  deps = {}
) {
  const clienteRepo = deps.clienteRepo;
  const favoritosRepo = deps.favoritosRepo ?? new ClienteFavoritosRepositorio();

  if (!clienteRepo) return;

  const cliente = await clienteRepo.buscarPorTelefono(marcaId, telefono);
  if (!cliente) return;

  const existe = await favoritosRepo.existe(
    marcaId,
    cliente.id,
    TIPO_DISENO,
    disenoId
  );
  if (existe) return;

  await favoritosRepo.agregar({
    marcaId,
    clienteId: cliente.id,
    tipo: TIPO_DISENO,
    referenciaId: disenoId,
  });
}

export async function quitarFavoritoDisenoPorTelefono(
  marcaId,
  telefono,
  disenoId,
  deps = {}
) {
  const seleccionRepo = deps.seleccionRepo ?? new CitaDisenosGaleriaRepositorio();
  const clienteRepo = deps.clienteRepo;
  const favoritosRepo = deps.favoritosRepo ?? new ClienteFavoritosRepositorio();

  if (!clienteRepo) return;

  const aunEnCitas = await seleccionRepo.existeDisenoParaTelefono(
    marcaId,
    telefono,
    disenoId
  );
  if (aunEnCitas) return;

  const cliente = await clienteRepo.buscarPorTelefono(marcaId, telefono);
  if (!cliente) return;

  await favoritosRepo.quitar(marcaId, cliente.id, TIPO_DISENO, disenoId);
}
