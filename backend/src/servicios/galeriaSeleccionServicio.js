import {
  ClienteRepositorio,
  MarcaRepositorio,
  ReservaRepositorio,
} from '../repositorios/index.js';
import { CitaDisenosGaleriaRepositorio } from '../repositorios/citaDisenosGaleriaRepositorio.js';
import { SeleccionesGaleriaTelefonoRepositorio } from '../repositorios/seleccionesGaleriaTelefonoRepositorio.js';
import { GaleriaRepositorio } from '../repositorios/galeriaRepositorio.js';
import {
  agregarFavoritoDisenoPorTelefono,
  quitarFavoritoDisenoPorTelefono,
} from '../utilidades/sincronizarFavoritoDisenoGaleria.js';
import { verificarMarcaOperativa } from '../utilidades/marcaOperativa.js';
import { requerido, telefono, validar } from '../utilidades/validador.js';
import { entero, texto } from '../utilidades/sanitizador.js';
import { normalizarHora } from '../utilidades/horarios.js';

function mapearCitaResumen(fila) {
  return {
    id: fila.id,
    codigo: fila.codigo_confirmacion,
    fecha: fila.fecha instanceof Date
      ? fila.fecha.toISOString().slice(0, 10)
      : String(fila.fecha).slice(0, 10),
    horaInicio: normalizarHora(String(fila.hora_inicio).slice(0, 5)),
    servicio: {
      id: fila.servicio_id,
      nombre: fila.servicio_nombre,
      duracionMinutos: fila.duracion_minutos,
      precio: Number(fila.precio),
    },
  };
}

export class GaleriaSeleccionServicio {
  constructor(deps = {}) {
    this.marcaRepo = deps.marcaRepo ?? new MarcaRepositorio();
    this.clienteRepo = deps.clienteRepo ?? new ClienteRepositorio();
    this.reservaRepo = deps.reservaRepo ?? new ReservaRepositorio();
    this.seleccionRepo = deps.seleccionRepo ?? new CitaDisenosGaleriaRepositorio();
    this.seleccionTelefonoRepo = deps.seleccionTelefonoRepo ?? new SeleccionesGaleriaTelefonoRepositorio();
    this.galeriaRepo = deps.galeriaRepo ?? new GaleriaRepositorio();
  }

  normalizarTelefono(telefonoEntrada) {
    const tel = texto(telefonoEntrada).replace(/\D+/g, '');
    const errores = validar(
      { telefono: tel },
      { telefono: (v) => requerido(v, 'telefono') ?? telefono(v) }
    );
    if (Object.keys(errores).length > 0) {
      return { error: errores.telefono ?? 'Telefono invalido.', codigoHttp: 422, errores };
    }
    return { telefono: tel };
  }

  async verificarMarca(marcaId) {
    const marca = await this.marcaRepo.buscarPorId(marcaId);
    if (!marca) return { error: 'Marca no encontrada.', codigoHttp: 404 };
    const operativa = verificarMarcaOperativa(marca);
    if (!operativa.ok) return { error: operativa.error, codigoHttp: operativa.codigoHttp };
    return { marca };
  }

  async iniciarSesion(marcaId, telefonoEntrada) {
    const telNorm = this.normalizarTelefono(telefonoEntrada);
    if (telNorm.error) return telNorm;

    const marcaOk = await this.verificarMarca(marcaId);
    if (marcaOk.error) return marcaOk;

    await this.reservaRepo.marcarPasadasComoCompletadas(marcaId);

    const cliente = await this.clienteRepo.buscarPorTelefono(marcaId, telNorm.telefono);
    const filas = cliente
      ? await this.reservaRepo.listarActivasPorTelefono(marcaId, telNorm.telefono)
      : [];
    const citasCliente = filas.filter(
      (fila) => Number(fila.cliente_id) === Number(cliente?.id)
    );

    return {
      telefono: telNorm.telefono,
      cliente: cliente
        ? { id: cliente.id, nombre: cliente.nombre }
        : null,
      citas: citasCliente.map(mapearCitaResumen),
    };
  }

  async listarSelecciones(marcaId, telefonoEntrada) {
    const telNorm = this.normalizarTelefono(telefonoEntrada);
    if (telNorm.error) return telNorm;

    const marcaOk = await this.verificarMarca(marcaId);
    if (marcaOk.error) return marcaOk;

    const disenoIds = await this.seleccionTelefonoRepo.listarIds(marcaId, telNorm.telefono);
    return { telefono: telNorm.telefono, disenoIds };
  }

  async agregarSeleccion(marcaId, disenoIdEntrada, telefonoEntrada) {
    const telNorm = this.normalizarTelefono(telefonoEntrada);
    if (telNorm.error) return telNorm;

    const disenoId = entero(disenoIdEntrada);
    if (!disenoId) {
      return { error: 'Diseno invalido.', codigoHttp: 422 };
    }

    const marcaOk = await this.verificarMarca(marcaId);
    if (marcaOk.error) return marcaOk;

    const diseno = await this.galeriaRepo.buscarPorId(marcaId, disenoId);
    if (!diseno || !diseno.activo) {
      return { error: 'Diseno no encontrado.', codigoHttp: 404 };
    }

    await this.seleccionTelefonoRepo.agregar({
      marcaId,
      telefono: telNorm.telefono,
      disenoId,
    });
    await this.seleccionTelefonoRepo.vincularDisenoACitasActivas(
      marcaId,
      telNorm.telefono,
      disenoId
    );

    await agregarFavoritoDisenoPorTelefono(marcaId, telNorm.telefono, disenoId, {
      clienteRepo: this.clienteRepo,
    });

    const disenoIds = await this.seleccionTelefonoRepo.listarIds(marcaId, telNorm.telefono);
    return {
      mensaje: 'Diseno guardado en tu celular.',
      telefono: telNorm.telefono,
      disenoIds,
    };
  }

  async quitarSeleccion(marcaId, disenoIdEntrada, telefonoEntrada) {
    const telNorm = this.normalizarTelefono(telefonoEntrada);
    if (telNorm.error) return telNorm;

    const disenoId = entero(disenoIdEntrada);
    if (!disenoId) {
      return { error: 'Diseno invalido.', codigoHttp: 422 };
    }

    const marcaOk = await this.verificarMarca(marcaId);
    if (marcaOk.error) return marcaOk;

    await this.seleccionTelefonoRepo.quitar(marcaId, telNorm.telefono, disenoId);
    await this.seleccionTelefonoRepo.quitarDisenoDeCitasActivas(
      marcaId,
      telNorm.telefono,
      disenoId
    );

    await quitarFavoritoDisenoPorTelefono(marcaId, telNorm.telefono, disenoId, {
      clienteRepo: this.clienteRepo,
      seleccionRepo: this.seleccionRepo,
    });

    const disenoIds = await this.seleccionTelefonoRepo.listarIds(marcaId, telNorm.telefono);
    return {
      mensaje: 'Diseno quitado de tu celular.',
      telefono: telNorm.telefono,
      disenoIds,
    };
  }
}

export const galeriaSeleccionServicio = new GaleriaSeleccionServicio();
