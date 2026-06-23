import { pool } from '../configuracion/baseDatos.js';
import {
  ReservaRepositorio,
  ClienteRepositorio,
  ServicioRepositorio,
  MarcaRepositorio,
  generarCodigoConfirmacion,
} from '../repositorios/index.js';
import {
  mapearCitaAdmin,
  mapearClienteAdmin,
  rangoSemanaDesdeFecha,
} from '../utilidades/mapeadorCitas.js';
import { esFechaValida, esHoraValida } from '../utilidades/fechaHora.js';
import { requerido, telefono, email, validar } from '../utilidades/validador.js';
import { texto, entero } from '../utilidades/sanitizador.js';
import { normalizarHora, sumarMinutosAHora, nombreDiaDesdeFecha, normalizarHorariosMarca, horarioPermitidoParaCita } from '../utilidades/horarios.js';
import { parsearJsonCampo } from '../utilidades/mapeador.js';

const ESTADOS_VALIDOS = ['pendiente', 'confirmada', 'cancelada', 'completada'];

export class AdminCitaServicio {
  constructor(deps = {}) {
    this.citaRepo = deps.citaRepo ?? new ReservaRepositorio();
    this.clienteRepo = deps.clienteRepo ?? new ClienteRepositorio();
    this.servicioRepo = deps.servicioRepo ?? new ServicioRepositorio();
    this.marcaRepo = deps.marcaRepo ?? new MarcaRepositorio();
  }

  async listarCitas(marcaId, filtros = {}) {
    const filas = await this.citaRepo.listarPorMarca(marcaId, filtros);
    return filas.map(mapearCitaAdmin);
  }

  async obtenerAgenda(marcaId, fecha, vista = 'dia') {
    if (!esFechaValida(fecha)) {
      return { error: 'Fecha invalida.', codigoHttp: 422 };
    }

    let filtros = {};
    if (vista === 'semana') {
      filtros = rangoSemanaDesdeFecha(fecha);
    } else {
      filtros = { fecha };
    }

    const citas = await this.listarCitas(marcaId, filtros);

    return {
      vista,
      fechaReferencia: fecha,
      rango: vista === 'semana' ? filtros : { fecha },
      citas,
      resumen: {
        total: citas.length,
        pendientes: citas.filter((c) => c.estado === 'pendiente').length,
        confirmadas: citas.filter((c) => c.estado === 'confirmada').length,
      },
    };
  }

  async crearCitaAdmin(marcaId, datos) {
    const servicioId = entero(datos.servicio_id ?? datos.servicioId);
    const clienteId = entero(datos.cliente_id ?? datos.clienteId);
    const fecha = texto(datos.fecha);
    const horaInicio = normalizarHora(texto(datos.hora_inicio ?? datos.horaInicio));
    const estado = texto(datos.estado) || 'confirmada';
    const notasInternas = texto(datos.notas_internas ?? datos.notasInternas) || null;

    const errores = validar(
      { servicio_id: servicioId, fecha, hora_inicio: horaInicio, estado },
      {
        servicio_id: (v) => (v ? null : 'El servicio es obligatorio.'),
        fecha: (v) => requerido(v, 'fecha') ?? (esFechaValida(v) ? null : 'Fecha invalida.'),
        hora_inicio: (v) => requerido(v, 'hora_inicio') ?? (esHoraValida(v) ? null : 'Hora invalida.'),
        estado: (v) => (ESTADOS_VALIDOS.includes(v) ? null : 'Estado invalido.'),
      }
    );

    if (Object.keys(errores).length > 0) {
      return { error: 'Datos invalidos.', errores, codigoHttp: 422 };
    }

    const servicio = await this.servicioRepo.buscarActivoPorId(marcaId, servicioId);
    if (!servicio) return { error: 'Servicio no encontrado.', codigoHttp: 404 };

    let idCliente = clienteId;

    if (!idCliente) {
      const nombre = texto(datos.nombre);
      const tel = texto(datos.telefono).replace(/\D+/g, '');
      const correoCliente = texto(datos.correo) || null;

      const errCliente = validar(
        { nombre, telefono: tel },
        {
          nombre: (v) => requerido(v, 'nombre'),
          telefono: (v) => requerido(v, 'telefono') ?? telefono(v),
        }
      );

      if (Object.keys(errCliente).length > 0) {
        return { error: 'Cliente invalido.', errores: errCliente, codigoHttp: 422 };
      }

      const existente = await this.clienteRepo.buscarPorTelefono(marcaId, tel);
      idCliente = existente
        ? existente.id
        : await this.clienteRepo.crear(null, {
            marcaId,
            nombre,
            telefono: tel,
            correo: correoCliente,
          });
    } else {
      const cliente = await this.clienteRepo.buscarPorId(marcaId, idCliente);
      if (!cliente) return { error: 'Cliente no encontrado.', codigoHttp: 404 };
    }

    const horaFin = sumarMinutosAHora(horaInicio, servicio.duracion_minutos);

    const marca = await this.marcaRepo.buscarPorIdCompleto(marcaId);
    if (marca) {
      const horarios = normalizarHorariosMarca(parsearJsonCampo(marca.horarios_json, {}));
      const dia = nombreDiaDesdeFecha(fecha);
      const permitido = horarioPermitidoParaCita(horarios[dia], horaInicio, servicio.duracion_minutos);
      if (!permitido.ok) {
        return { error: permitido.error, codigoHttp: 409 };
      }
    }

    const conexion = await pool.getConnection();

    try {
      await conexion.beginTransaction();

      const solapa = await this.citaRepo.existeSolapamiento(
        conexion,
        marcaId,
        fecha,
        horaInicio,
        horaFin
      );

      if (solapa) {
        await conexion.rollback();
        return { error: 'Horario no disponible.', codigoHttp: 409 };
      }

      const citaId = await this.citaRepo.crear(conexion, {
        marcaId,
        clienteId: idCliente,
        servicioId,
        codigoConfirmacion: generarCodigoConfirmacion(),
        fecha,
        horaInicio,
        horaFin,
        estado,
        notasInternas,
      });

      await conexion.commit();

      const clienteFila = await this.clienteRepo.buscarPorId(marcaId, idCliente);

      try {
        const { notificacionServicio } = await import('./notificacionServicio.js');
        await notificacionServicio.registrarNuevaCita({
          marcaId,
          citaId,
          origen: 'admin',
          clienteNombre: clienteFila?.nombre ?? 'Cliente',
          servicioNombre: servicio.nombre,
          fecha,
          horaInicio,
        });
      } catch {
        // Notificacion no bloquea la cita
      }

      try {
        const { googleCalendarServicio } = await import('./googleCalendarServicio.js');
        await googleCalendarServicio.sincronizarCita(marcaId, {
          fecha,
          horaInicio,
          horaFin,
          titulo: `${servicio.nombre} — ${clienteFila?.nombre ?? 'Cliente'}`,
          descripcion: `Cita admin · ${citaId}`,
          clienteNombre: clienteFila?.nombre,
        });
      } catch {
        // Sync opcional
      }

      const cita = mapearCitaAdmin(await this.citaRepo.buscarPorId(marcaId, citaId));
      return { cita };
    } catch (err) {
      await conexion.rollback();
      throw err;
    } finally {
      conexion.release();
    }
  }

  async actualizarCita(marcaId, citaId, datos) {
    const citaActual = await this.citaRepo.buscarPorId(marcaId, citaId);
    if (!citaActual) return { error: 'Cita no encontrada.', codigoHttp: 404 };

    const fecha = datos.fecha !== undefined ? texto(datos.fecha) : formatearFecha(citaActual.fecha);
    const horaInicio = datos.hora_inicio ?? datos.horaInicio
      ? normalizarHora(texto(datos.hora_inicio ?? datos.horaInicio))
      : normalizarHora(String(citaActual.hora_inicio));
    const estado = datos.estado !== undefined ? texto(datos.estado) : citaActual.estado;
    const notasInternas = datos.notas_internas ?? datos.notasInternas !== undefined
      ? texto(datos.notas_internas ?? datos.notasInternas)
      : citaActual.notas_internas;

    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      return { error: 'Estado invalido.', codigoHttp: 422 };
    }

    const servicio = await this.servicioRepo.buscarActivoPorId(marcaId, citaActual.servicio_id);
    const horaFin = sumarMinutosAHora(horaInicio, servicio?.duracion_minutos ?? 60);

    if (estado !== 'cancelada') {
      const marca = await this.marcaRepo.buscarPorIdCompleto(marcaId);
      if (marca && servicio) {
        const horarios = normalizarHorariosMarca(parsearJsonCampo(marca.horarios_json, {}));
        const dia = nombreDiaDesdeFecha(fecha);
        const permitido = horarioPermitidoParaCita(horarios[dia], horaInicio, servicio.duracion_minutos);
        if (!permitido.ok) {
          return { error: permitido.error, codigoHttp: 409 };
        }
      }
    }

    const conexion = await pool.getConnection();

    try {
      await conexion.beginTransaction();

      if (estado !== 'cancelada') {
        const solapa = await this.citaRepo.existeSolapamiento(
          conexion,
          marcaId,
          fecha,
          horaInicio,
          horaFin,
          citaId
        );

        if (solapa) {
          await conexion.rollback();
          return { error: 'Horario no disponible.', codigoHttp: 409 };
        }
      }

      await this.citaRepo.actualizar(conexion, marcaId, citaId, {
        fecha,
        horaInicio,
        horaFin,
        estado,
        notasInternas,
      });

      await conexion.commit();

      const cita = mapearCitaAdmin(await this.citaRepo.buscarPorId(marcaId, citaId));
      return { cita };
    } catch (err) {
      await conexion.rollback();
      throw err;
    } finally {
      conexion.release();
    }
  }

  async cancelarCita(marcaId, citaId) {
    return this.actualizarCita(marcaId, citaId, { estado: 'cancelada' });
  }
}

function formatearFecha(valor) {
  if (valor instanceof Date) {
    return valor.toISOString().slice(0, 10);
  }
  return String(valor).slice(0, 10);
}

export class AdminClienteServicio {
  constructor(clienteRepo = new ClienteRepositorio()) {
    this.clienteRepo = clienteRepo;
  }

  async listar(marcaId, busqueda = '') {
    const filas = await this.clienteRepo.listarPorMarca(marcaId, busqueda);
    return filas.map(mapearClienteAdmin);
  }

  async crear(marcaId, datos) {
    const nombre = texto(datos.nombre);
    const tel = texto(datos.telefono).replace(/\D+/g, '');
    const correo = texto(datos.correo) || null;
    const notas = texto(datos.notas) || null;

    const errores = validar(
      { nombre, telefono: tel, correo },
      {
        nombre: (v) => requerido(v, 'nombre'),
        telefono: (v) => requerido(v, 'telefono') ?? telefono(v),
        correo: (v) => email(v),
      }
    );

    if (Object.keys(errores).length > 0) {
      return { error: 'Datos invalidos.', errores, codigoHttp: 422 };
    }

    const existente = await this.clienteRepo.buscarPorTelefono(marcaId, tel);
    if (existente) {
      return { error: 'Ya existe un cliente con ese telefono en esta marca.', codigoHttp: 409 };
    }

    const id = await this.clienteRepo.crear(null, {
      marcaId,
      nombre,
      telefono: tel,
      correo,
      notas,
    });

    const cliente = mapearClienteAdmin(await this.clienteRepo.buscarPorId(marcaId, id));
    return { cliente };
  }
}
