import {
  ClienteRepositorio,
  MarcaRepositorio,
  ReservaRepositorio,
} from '../repositorios/index.js';
import { CitaDisenosGaleriaRepositorio } from '../repositorios/citaDisenosGaleriaRepositorio.js';
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

  async verificarCitaTelefono(marcaId, citaId, telefono) {
    const cita = await this.reservaRepo.buscarPorId(marcaId, citaId);
    if (!cita) {
      return { error: 'Cita no encontrada.', codigoHttp: 404 };
    }

    if (!['pendiente', 'confirmada'].includes(cita.estado)) {
      return { error: 'Esta cita ya no esta activa.', codigoHttp: 409 };
    }

    const telCita = String(cita.cliente_telefono ?? '').replace(/\D+/g, '');
    if (telCita !== telefono) {
      return { error: 'El telefono no coincide con la cita seleccionada.', codigoHttp: 403 };
    }

    return { cita };
  }

  async iniciarSesion(marcaId, telefonoEntrada) {
    const telNorm = this.normalizarTelefono(telefonoEntrada);
    if (telNorm.error) return telNorm;

    const marcaOk = await this.verificarMarca(marcaId);
    if (marcaOk.error) return marcaOk;

    await this.reservaRepo.marcarPasadasComoCompletadas(marcaId);

    const cliente = await this.clienteRepo.buscarPorTelefono(marcaId, telNorm.telefono);
    if (!cliente) {
      return {
        error: 'No encontramos reservas con ese telefono. Agenda una cita primero.',
        codigoHttp: 404,
      };
    }

    const filas = await this.reservaRepo.listarActivasPorTelefono(marcaId, telNorm.telefono);
    const citasCliente = filas.filter(
      (fila) => Number(fila.cliente_id) === Number(cliente.id)
    );

    if (citasCliente.length === 0) {
      return {
        error: 'No tienes citas activas. Reserva un servicio para elegir disenos.',
        codigoHttp: 404,
      };
    }

    return {
      telefono: telNorm.telefono,
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
      },
      citas: citasCliente.map(mapearCitaResumen),
    };
  }

  async listarSelecciones(marcaId, citaId, telefonoEntrada) {
    const telNorm = this.normalizarTelefono(telefonoEntrada);
    if (telNorm.error) return telNorm;

    const citaOk = await this.verificarCitaTelefono(marcaId, citaId, telNorm.telefono);
    if (citaOk.error) return citaOk;

    const disenoIds = await this.seleccionRepo.listarIdsPorCita(marcaId, citaId);
    return { citaId, disenoIds };
  }

  async agregarSeleccion(marcaId, citaId, disenoIdEntrada, telefonoEntrada) {
    const telNorm = this.normalizarTelefono(telefonoEntrada);
    if (telNorm.error) return telNorm;

    const citaIdNum = entero(citaId);
    const disenoId = entero(disenoIdEntrada);
    if (!citaIdNum || !disenoId) {
      return { error: 'Cita o diseno invalidos.', codigoHttp: 422 };
    }

    const citaOk = await this.verificarCitaTelefono(marcaId, citaIdNum, telNorm.telefono);
    if (citaOk.error) return citaOk;

    const diseno = await this.galeriaRepo.buscarPorId(marcaId, disenoId);
    if (!diseno || !diseno.activo) {
      return { error: 'Diseno no encontrado.', codigoHttp: 404 };
    }

    const yaExiste = await this.seleccionRepo.existe(marcaId, citaIdNum, disenoId);
    if (yaExiste) {
      return { error: 'Este diseno ya esta en tu seleccion.', codigoHttp: 409 };
    }

    await this.seleccionRepo.agregar({
      marcaId,
      citaId: citaIdNum,
      disenoId,
      telefono: telNorm.telefono,
    });

    await agregarFavoritoDisenoPorTelefono(marcaId, telNorm.telefono, disenoId, {
      clienteRepo: this.clienteRepo,
    });

    const disenoIds = await this.seleccionRepo.listarIdsPorCita(marcaId, citaIdNum);
    return {
      mensaje: 'Diseno guardado para tu cita.',
      citaId: citaIdNum,
      disenoIds,
    };
  }

  async quitarSeleccion(marcaId, citaId, disenoIdEntrada, telefonoEntrada) {
    const telNorm = this.normalizarTelefono(telefonoEntrada);
    if (telNorm.error) return telNorm;

    const citaIdNum = entero(citaId);
    const disenoId = entero(disenoIdEntrada);
    if (!citaIdNum || !disenoId) {
      return { error: 'Cita o diseno invalidos.', codigoHttp: 422 };
    }

    const citaOk = await this.verificarCitaTelefono(marcaId, citaIdNum, telNorm.telefono);
    if (citaOk.error) return citaOk;

    const eliminado = await this.seleccionRepo.quitar(marcaId, citaIdNum, disenoId);
    if (!eliminado) {
      return { error: 'Este diseno no estaba en tu seleccion.', codigoHttp: 404 };
    }

    await quitarFavoritoDisenoPorTelefono(marcaId, telNorm.telefono, disenoId, {
      clienteRepo: this.clienteRepo,
      seleccionRepo: this.seleccionRepo,
    });

    const disenoIds = await this.seleccionRepo.listarIdsPorCita(marcaId, citaIdNum);
    return {
      mensaje: 'Diseno quitado de tu seleccion.',
      citaId: citaIdNum,
      disenoIds,
    };
  }
}

export const galeriaSeleccionServicio = new GaleriaSeleccionServicio();
