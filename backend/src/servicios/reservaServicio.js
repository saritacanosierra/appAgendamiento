import { pool } from '../configuracion/baseDatos.js';
import {
  MarcaRepositorio,
  ServicioRepositorio,
  ClienteRepositorio,
  ReservaRepositorio,
  generarCodigoConfirmacion,
  parsearJsonCampo,
} from '../repositorios/index.js';
import { CalendarioServicio } from './calendarioServicio.js';
import { mapearMarcaPublica } from './marcaServicio.js';
import { esFechaValida, esHoraValida } from '../utilidades/fechaHora.js';
import { requerido, telefono, email, validar } from '../utilidades/validador.js';
import { texto, entero } from '../utilidades/sanitizador.js';
import {
  calcularHorariosDisponibles,
  nombreDiaDesdeFecha,
  sumarMinutosAHora,
  normalizarHora,
  construirFechaHoraLocal,
  fechaEsPasada,
  filtrarHorasPasadas,
} from '../utilidades/horarios.js';

export class ReservaServicio {
  constructor(deps = {}) {
    this.marcaRepo = deps.marcaRepo ?? new MarcaRepositorio();
    this.servicioRepo = deps.servicioRepo ?? new ServicioRepositorio();
    this.clienteRepo = deps.clienteRepo ?? new ClienteRepositorio();
    this.reservaRepo = deps.reservaRepo ?? new ReservaRepositorio();
    this.calendario = deps.calendario ?? new CalendarioServicio();
  }

  async obtenerDisponibilidad(marcaId, servicioId, fecha) {
    if (!esFechaValida(fecha)) {
      return { error: 'Fecha invalida.', codigoHttp: 422 };
    }

    if (fechaEsPasada(fecha)) {
      return { error: 'No puedes reservar en fechas pasadas.', codigoHttp: 422 };
    }

    const [marca, servicio] = await Promise.all([
      this.marcaRepo.buscarPorId(marcaId),
      this.servicioRepo.buscarActivoPorId(marcaId, servicioId),
    ]);

    if (!marca) return { error: 'Marca no encontrada.', codigoHttp: 404 };
    if (!servicio) return { error: 'Servicio no encontrado.', codigoHttp: 404 };

    const horarios = parsearJsonCampo(marca.horarios_json, {});
    const dia = nombreDiaDesdeFecha(fecha);
    const horarioDia = horarios[dia];

    if (!horarioDia) {
      return { horarios: [], mensaje: 'La marca no atiende este dia.' };
    }

    const citasOcupadas = await this.reservaRepo.listarOcupadasPorFecha(marcaId, fecha);
    let horariosDisponibles = calcularHorariosDisponibles({
      horarioDia,
      duracionMinutos: servicio.duracion_minutos,
      citasOcupadas,
    });

    horariosDisponibles = filtrarHorasPasadas(fecha, horariosDisponibles);

    return {
      fecha,
      servicioId,
      duracionMinutos: servicio.duracion_minutos,
      horarios: horariosDisponibles,
    };
  }

  async crearReservaPublica(datosEntrada) {
    const marcaId = entero(datosEntrada.marca_id ?? datosEntrada.marcaId);
    const servicioId = entero(datosEntrada.servicio_id ?? datosEntrada.servicioId);
    const fecha = texto(datosEntrada.fecha);
    const horaInicio = normalizarHora(texto(datosEntrada.hora_inicio ?? datosEntrada.horaInicio));
    const nombre = texto(datosEntrada.nombre);
    const telefonoCliente = texto(datosEntrada.telefono).replace(/\D+/g, '');
    const correo = texto(datosEntrada.correo) || null;

    const errores = validar(
      {
        marca_id: marcaId,
        servicio_id: servicioId,
        fecha,
        hora_inicio: horaInicio,
        nombre,
        telefono: telefonoCliente,
        correo,
      },
      {
        marca_id: (v) => (v ? null : 'La marca es obligatoria.'),
        servicio_id: (v) => (v ? null : 'El servicio es obligatorio.'),
        fecha: (v) => requerido(v, 'fecha') ?? (esFechaValida(v) ? null : 'Fecha invalida.'),
        hora_inicio: (v) => requerido(v, 'hora_inicio') ?? (esHoraValida(v) ? null : 'Hora invalida.'),
        nombre: (v) => requerido(v, 'nombre'),
        telefono: (v) => requerido(v, 'telefono') ?? telefono(v),
        correo: (v) => email(v),
      }
    );

    if (Object.keys(errores).length > 0) {
      return { error: 'Datos invalidos.', errores, codigoHttp: 422 };
    }

    if (fechaEsPasada(fecha)) {
      return { error: 'No puedes reservar en fechas pasadas.', codigoHttp: 422 };
    }

    const disponibilidad = await this.obtenerDisponibilidad(marcaId, servicioId, fecha);
    if (disponibilidad.error) {
      return disponibilidad;
    }

    if (!disponibilidad.horarios.includes(horaInicio)) {
      return { error: 'El horario seleccionado ya no esta disponible.', codigoHttp: 409 };
    }

    const [marca, servicio] = await Promise.all([
      this.marcaRepo.buscarPorId(marcaId),
      this.servicioRepo.buscarActivoPorId(marcaId, servicioId),
    ]);

    const horaFin = sumarMinutosAHora(horaInicio, servicio.duracion_minutos);
    const codigoConfirmacion = generarCodigoConfirmacion();

    const conexion = await pool.getConnection();

    try {
      await conexion.beginTransaction();

      const haySolapamiento = await this.reservaRepo.existeSolapamiento(
        conexion,
        marcaId,
        fecha,
        horaInicio,
        horaFin
      );

      if (haySolapamiento) {
        await conexion.rollback();
        return { error: 'Ese horario acaba de ser reservado. Elige otro.', codigoHttp: 409 };
      }

      let cliente = await this.clienteRepo.buscarPorTelefono(marcaId, telefonoCliente);
      let clienteId;

      if (cliente) {
        clienteId = cliente.id;
        await this.clienteRepo.actualizarDatos(conexion, clienteId, { nombre, correo });
      } else {
        clienteId = await this.clienteRepo.crear(conexion, {
          marcaId,
          nombre,
          telefono: telefonoCliente,
          correo,
        });
      }

      const citaId = await this.reservaRepo.crear(conexion, {
        marcaId,
        clienteId,
        servicioId,
        codigoConfirmacion,
        fecha,
        horaInicio,
        horaFin,
        estado: 'pendiente',
      });

      await conexion.commit();

      try {
        const { notificacionServicio } = await import('./notificacionServicio.js');
        await notificacionServicio.registrarNuevaCita({
          marcaId,
          citaId,
          origen: 'publica',
          clienteNombre: nombre,
          servicioNombre: servicio.nombre,
          fecha,
          horaInicio,
        });
      } catch {
        // Notificacion no bloquea la reserva
      }

      try {
        const { googleCalendarServicio } = await import('./googleCalendarServicio.js');
        await googleCalendarServicio.sincronizarCita(marcaId, {
          fecha,
          horaInicio,
          horaFin,
          titulo: `${servicio.nombre} — ${nombre}`,
          descripcion: `Reserva publica · ${codigoConfirmacion}`,
          clienteNombre: nombre,
        });
      } catch {
        // Sync opcional
      }

      const confirmacion = this.armarConfirmacion({
        id: citaId,
        codigoConfirmacion,
        fecha,
        horaInicio,
        horaFin,
        estado: 'pendiente',
        servicio,
        marca,
        cliente: { nombre, telefono: telefonoCliente, correo },
      });

      try {
        const { emailServicio } = await import('./emailServicio.js');
        const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/$/, '');
        const slug = marca.slug ?? '';
        await emailServicio.enviarConfirmacionReserva({
          confirmacion,
          urlConfirmacion: `${frontendUrl}/m/${slug}/confirmacion/${codigoConfirmacion}`,
        });
      } catch {
        // Email no bloquea la reserva
      }

      return { confirmacion };
    } catch (err) {
      await conexion.rollback();
      throw err;
    } finally {
      conexion.release();
    }
  }

  async obtenerPorCodigo(codigo) {
    const fila = await this.reservaRepo.buscarPorCodigo(codigo);
    if (!fila) return null;

    return this.armarConfirmacion({
      id: fila.id,
      codigoConfirmacion: fila.codigo_confirmacion,
      fecha: fila.fecha instanceof Date
        ? fila.fecha.toISOString().slice(0, 10)
        : String(fila.fecha).slice(0, 10),
      horaInicio: normalizarHora(String(fila.hora_inicio).slice(0, 5)),
      horaFin: normalizarHora(String(fila.hora_fin).slice(0, 5)),
      estado: fila.estado,
      servicio: {
        nombre: fila.servicio_nombre,
        duracion_minutos: fila.duracion_minutos,
        precio: fila.precio,
      },
      marca: {
        id: fila.marca_id,
        nombre_comercial: fila.nombre_comercial,
        slug: fila.marca_slug,
        direccion: fila.marca_direccion,
      },
      cliente: {
        nombre: fila.cliente_nombre,
        telefono: fila.cliente_telefono,
        correo: fila.cliente_correo,
      },
    });
  }

  armarConfirmacion({ id, codigoConfirmacion, fecha, horaInicio, horaFin, estado, servicio, marca, cliente }) {
    const marcaPublica = mapearMarcaPublica(marca) ?? {
      nombreComercial: marca.nombre_comercial,
      slug: marca.slug,
      direccion: marca.direccion,
    };

    const titulo = `${servicio.nombre} — ${marcaPublica.nombreComercial}`;
    const fechaInicio = construirFechaHoraLocal(fecha, horaInicio);
    const fechaFin = construirFechaHoraLocal(fecha, horaFin);

    const descripcion = [
      `Servicio: ${servicio.nombre}`,
      `Cliente: ${cliente.nombre}`,
      `Codigo: ${codigoConfirmacion}`,
    ].join('\n');

    const datosCalendario = {
      codigo: codigoConfirmacion,
      titulo,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      descripcion,
      ubicacion: marcaPublica.direccion ?? '',
    };

    const mensajeConfirmacion =
      `Tu cita en ${marcaPublica.nombreComercial} quedo registrada para el ${fecha} a las ${horaInicio}. `
      + `Servicio: ${servicio.nombre}. Codigo: ${codigoConfirmacion}.`;

    return {
      cita: {
        id,
        codigo: codigoConfirmacion,
        fecha,
        horaInicio,
        horaFin,
        estado,
        servicio: {
          nombre: servicio.nombre,
          duracionMinutos: servicio.duracion_minutos,
          precio: Number(servicio.precio),
        },
        marca: {
          nombreComercial: marcaPublica.nombreComercial,
          slug: marcaPublica.slug,
          direccion: marcaPublica.direccion,
        },
        cliente: {
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          correo: cliente.correo,
        },
      },
      calendario: {
        enlaceGoogle: this.calendario.generarEnlaceGoogleCalendar(datosCalendario),
        icsContenido: this.calendario.generarArchivoIcs(datosCalendario),
        nombreArchivoIcs: `cita-${marcaPublica.slug ?? 'spa'}.ics`,
      },
      mensajeConfirmacion,
    };
  }
}
