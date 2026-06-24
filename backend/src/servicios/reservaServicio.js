import { pool } from '../configuracion/baseDatos.js';
import {
  MarcaRepositorio,
  ServicioRepositorio,
  ClienteRepositorio,
  ReservaRepositorio,
  SolicitudReagendamientoRepositorio,
  generarCodigoConfirmacion,
  parsearJsonCampo,
} from '../repositorios/index.js';
import { ClientePerfilServicio } from './clientePerfilServicio.js';
import { CalendarioServicio } from './calendarioServicio.js';
import { mapearMarcaPublica } from './marcaServicio.js';
import { verificarMarcaOperativa } from '../utilidades/marcaOperativa.js';
import { esFechaValida, esHoraValida } from '../utilidades/fechaHora.js';
import { requerido, telefono, email, validar } from '../utilidades/validador.js';
import { texto, entero } from '../utilidades/sanitizador.js';
import {
  calcularHorariosDisponibles,
  nombreDiaDesdeFecha,
  sumarMinutosAHora,
  normalizarHora,
  normalizarHorariosMarca,
  construirFechaHoraLocal,
  fechaEsPasada,
  filtrarHorasPasadas,
  cumpleAntelacionMinimaCliente,
  puedeCancelarCitaPublica,
  ANTELACION_MINIMA_CLIENTE_HORAS,
} from '../utilidades/horarios.js';

export class ReservaServicio {
  constructor(deps = {}) {
    this.marcaRepo = deps.marcaRepo ?? new MarcaRepositorio();
    this.servicioRepo = deps.servicioRepo ?? new ServicioRepositorio();
    this.clienteRepo = deps.clienteRepo ?? new ClienteRepositorio();
    this.reservaRepo = deps.reservaRepo ?? new ReservaRepositorio();
    this.solicitudRepo = deps.solicitudRepo ?? new SolicitudReagendamientoRepositorio();
    this.calendario = deps.calendario ?? new CalendarioServicio();
    this.clientePerfil = deps.clientePerfil ?? new ClientePerfilServicio();
  }

  async obtenerDisponibilidad(marcaId, servicioId, fecha) {
    if (!esFechaValida(fecha)) {
      return { error: 'Fecha invalida.', codigoHttp: 422 };
    }

    if (fechaEsPasada(fecha)) {
      return { error: 'No puedes reservar en fechas pasadas.', codigoHttp: 422 };
    }

    const [marca, servicio] = await Promise.all([
      this.marcaRepo.buscarPorIdCompleto(marcaId),
      this.servicioRepo.buscarActivoPorId(marcaId, servicioId),
    ]);

    if (!marca) return { error: 'Marca no encontrada.', codigoHttp: 404 };
    const operativa = verificarMarcaOperativa(marca);
    if (!operativa.ok) return { error: operativa.error, codigoHttp: operativa.codigoHttp };
    if (!servicio) return { error: 'Servicio no encontrado.', codigoHttp: 404 };

    const horarios = normalizarHorariosMarca(parsearJsonCampo(marca.horarios_json, {}));
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
    const nombre = texto(datosEntrada.nombre, { capitalizar: 'palabras' });
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
        const urlConfirmacion = `${frontendUrl}/m/${slug}/confirmacion/${codigoConfirmacion}`;
        await emailServicio.enviarConfirmacionReserva({
          confirmacion,
          urlConfirmacion,
        });
      } catch {
        // Email no bloquea la reserva
      }

      try {
        const { whatsappServicio } = await import('./whatsappServicio.js');
        const { whatsappMarcaServicio } = await import('./whatsappMarcaServicio.js');
        const credenciales = await whatsappMarcaServicio.obtenerCredenciales(marcaId);
        const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/$/, '');
        const slug = marca.slug ?? '';
        await whatsappServicio.enviarConfirmacionReserva({
          confirmacion,
          urlConfirmacion: `${frontendUrl}/m/${slug}/confirmacion/${codigoConfirmacion}`,
          credenciales,
        });
      } catch {
        // WhatsApp no bloquea la reserva
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

  formatearFechaCita(valor) {
    if (valor instanceof Date) return valor.toISOString().slice(0, 10);
    return String(valor).slice(0, 10);
  }

  async mapearCitaPublicaGestion(fila) {
    const fecha = this.formatearFechaCita(fila.fecha);
    const horaInicio = normalizarHora(String(fila.hora_inicio).slice(0, 5));
    const horaFin = normalizarHora(String(fila.hora_fin).slice(0, 5));
    const activa = ['pendiente', 'confirmada'].includes(fila.estado);
    const cumpleAntelacionReagendar = cumpleAntelacionMinimaCliente(fecha, horaInicio);
    const puedeCancelar = activa && puedeCancelarCitaPublica(fecha, horaInicio);
    const solicitudPendiente = activa
      ? await this.solicitudRepo.buscarPendientePorCita(fila.id)
      : null;

    let mensajeRestriccion = null;
    if (activa && !puedeCancelar && !cumpleAntelacionReagendar) {
      mensajeRestriccion = 'La cita ya comenzo o finalizo. Ya no puedes cancelar ni reagendar en linea.';
    } else if (activa && !puedeCancelar) {
      mensajeRestriccion = 'La cita ya comenzo. Ya no puedes cancelar en linea.';
    } else if (activa && !cumpleAntelacionReagendar) {
      mensajeRestriccion = `Para reagendar necesitas al menos ${ANTELACION_MINIMA_CLIENTE_HORAS} horas de anticipacion. Aun puedes cancelar hasta la hora del servicio.`;
    }

    return {
      id: fila.id,
      codigo: fila.codigo_confirmacion,
      fecha,
      horaInicio,
      horaFin,
      estado: fila.estado,
      canceladaPor: fila.cancelada_por ?? null,
      servicio: {
        id: fila.servicio_id,
        nombre: fila.servicio_nombre,
        duracionMinutos: fila.duracion_minutos,
        precio: Number(fila.precio),
      },
      marca: {
        id: fila.marca_id,
        nombreComercial: fila.nombre_comercial,
        slug: fila.marca_slug,
        direccion: fila.marca_direccion,
      },
      cliente: {
        nombre: fila.cliente_nombre,
        telefono: fila.cliente_telefono,
      },
      activa,
      puedeCancelar: puedeCancelar && !solicitudPendiente,
      puedeReagendar: activa && cumpleAntelacionReagendar && !solicitudPendiente,
      mensajeRestriccion,
      solicitudReagendamiento: solicitudPendiente
        ? {
            id: solicitudPendiente.id,
            fechaSolicitada: this.formatearFechaCita(solicitudPendiente.fecha_solicitada),
            horaInicioSolicitada: normalizarHora(String(solicitudPendiente.hora_inicio_solicitada).slice(0, 5)),
            horaFinSolicitada: normalizarHora(String(solicitudPendiente.hora_fin_solicitada).slice(0, 5)),
            estado: solicitudPendiente.estado,
          }
        : null,
    };
  }

  async consultarCitas(marcaId, { correo, telefono: telefonoEntrada }) {
    const tel = texto(telefonoEntrada).replace(/\D+/g, '');
    const correoNorm = texto(correo).trim().toLowerCase();

    const errores = validar(
      { marca_id: marcaId, telefono: tel, correo: correoNorm },
      {
        marca_id: (v) => (v ? null : 'La marca es obligatoria.'),
        telefono: (v) => requerido(v, 'telefono') ?? telefono(v),
        correo: (v) => requerido(v, 'correo') ?? email(v),
      }
    );

    if (Object.keys(errores).length > 0) {
      return { error: 'Datos incorrectos.', codigoHttp: 422 };
    }

    const marca = await this.marcaRepo.buscarPorId(marcaId);
    if (!marca) return { error: 'Marca no encontrada.', codigoHttp: 404 };
    const operativa = verificarMarcaOperativa(marca);
    if (!operativa.ok) return { error: operativa.error, codigoHttp: operativa.codigoHttp };

    await this.reservaRepo.marcarPasadasComoCompletadas(marcaId);

    const auth = await this.clientePerfil.autenticarCliente(marcaId, tel, correoNorm);
    if (auth.error) return auth;

    const { cliente } = auth;

    let filas = await this.reservaRepo.listarActivasPorTelefono(marcaId, tel);
    filas = filas.filter(
      (fila) => Number(fila.cliente_id) === Number(cliente.id)
    );

    const citas = await Promise.all(filas.map((f) => this.mapearCitaPublicaGestion(f)));
    const perfil = await this.clientePerfil.obtenerPerfil(marcaId, cliente.id);

    return {
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        correo: cliente.correo,
        puntos: perfil.puntos,
        totalFavoritos: perfil.totalFavoritos,
        serviciosCompletados: perfil.serviciosCompletados,
      },
      favoritos: perfil.favoritos,
      citas,
      antelacionReagendarHoras: ANTELACION_MINIMA_CLIENTE_HORAS,
      cancelacionHastaInicio: true,
    };
  }

  async verificarAccesoCita(codigo, telefonoEntrada, marcaId = null) {
    const tel = texto(telefonoEntrada).replace(/\D+/g, '');
    const codigoNorm = texto(codigo).toUpperCase();

    const fila = marcaId
      ? await this.reservaRepo.buscarPorCodigoYMarca(codigoNorm, marcaId)
      : await this.reservaRepo.buscarPorCodigo(codigoNorm);

    if (!fila) return { error: 'Cita no encontrada.', codigoHttp: 404 };
    if (fila.cliente_telefono !== tel) {
      return { error: 'El telefono no coincide con esta reserva.', codigoHttp: 403 };
    }

    return { fila };
  }

  async cancelarReservaPublica(marcaId, codigo, telefono) {
    await this.reservaRepo.marcarPasadasComoCompletadas(marcaId);

    const acceso = await this.verificarAccesoCita(codigo, telefono, marcaId);
    if (acceso.error) return acceso;

    const { fila } = acceso;
    const fecha = this.formatearFechaCita(fila.fecha);
    const horaInicio = normalizarHora(String(fila.hora_inicio).slice(0, 5));

    if (!['pendiente', 'confirmada'].includes(fila.estado)) {
      return { error: 'Esta cita ya no esta activa.', codigoHttp: 409 };
    }

    if (!puedeCancelarCitaPublica(fecha, horaInicio)) {
      return {
        error: 'Ya no puedes cancelar: la hora del servicio ya comenzo o la cita fue atendida.',
        codigoHttp: 422,
      };
    }

    const pendiente = await this.solicitudRepo.buscarPendientePorCita(fila.id);
    if (pendiente) {
      await this.solicitudRepo.actualizarEstado(null, fila.marca_id, pendiente.id, 'rechazada');
    }

    const conexion = await pool.getConnection();

    try {
      await conexion.beginTransaction();
      await this.reservaRepo.actualizar(conexion, fila.marca_id, fila.id, {
        estado: 'cancelada',
        canceladaPor: 'cliente',
      });
      await conexion.commit();
    } catch (err) {
      await conexion.rollback();
      throw err;
    } finally {
      conexion.release();
    }

    try {
      const { notificacionServicio } = await import('./notificacionServicio.js');
      await notificacionServicio.registrarCancelacionCliente({
        marcaId: fila.marca_id,
        citaId: fila.id,
        clienteNombre: fila.cliente_nombre,
        servicioNombre: fila.servicio_nombre,
        fecha,
        horaInicio,
      });
    } catch {
      // Notificacion opcional
    }

    const actualizada = await this.reservaRepo.buscarPorCodigo(codigo);
    return { cita: await this.mapearCitaPublicaGestion(actualizada) };
  }

  async solicitarReagendamiento(marcaId, codigo, telefono, nuevaFecha, nuevaHora) {
    const acceso = await this.verificarAccesoCita(codigo, telefono, marcaId);
    if (acceso.error) return acceso;

    const { fila } = acceso;
    const fechaActual = this.formatearFechaCita(fila.fecha);
    const horaActual = normalizarHora(String(fila.hora_inicio).slice(0, 5));
    const fecha = texto(nuevaFecha);
    const horaInicio = normalizarHora(texto(nuevaHora));

    const errores = validar(
      { fecha, hora_inicio: horaInicio },
      {
        fecha: (v) => requerido(v, 'fecha') ?? (esFechaValida(v) ? null : 'Fecha invalida.'),
        hora_inicio: (v) => requerido(v, 'hora_inicio') ?? (esHoraValida(v) ? null : 'Hora invalida.'),
      }
    );

    if (Object.keys(errores).length > 0) {
      return { error: 'Datos invalidos.', errores, codigoHttp: 422 };
    }

    if (!['pendiente', 'confirmada'].includes(fila.estado)) {
      return { error: 'Esta cita ya no esta activa.', codigoHttp: 409 };
    }

    if (!cumpleAntelacionMinimaCliente(fechaActual, horaActual)) {
      return {
        error: `Solo puedes reagendar con al menos ${ANTELACION_MINIMA_CLIENTE_HORAS} horas de anticipacion.`,
        codigoHttp: 422,
      };
    }

    const pendiente = await this.solicitudRepo.buscarPendientePorCita(fila.id);
    if (pendiente) {
      return { error: 'Ya tienes una solicitud de reagendamiento pendiente.', codigoHttp: 409 };
    }

    if (fechaActual === fecha && horaActual === horaInicio) {
      return { error: 'Elige una fecha u hora distinta a la actual.', codigoHttp: 422 };
    }

    const disponibilidad = await this.obtenerDisponibilidad(fila.marca_id, fila.servicio_id, fecha);
    if (disponibilidad.error) return disponibilidad;

    if (!disponibilidad.horarios.includes(horaInicio)) {
      return { error: 'El horario seleccionado no esta disponible.', codigoHttp: 409 };
    }

    const horaFin = sumarMinutosAHora(horaInicio, fila.duracion_minutos);
    const conexion = await pool.getConnection();

    try {
      await conexion.beginTransaction();

      const solapa = await this.reservaRepo.existeSolapamiento(
        conexion,
        fila.marca_id,
        fecha,
        horaInicio,
        horaFin,
        fila.id
      );

      if (solapa) {
        await conexion.rollback();
        return { error: 'Ese horario acaba de ser reservado. Elige otro.', codigoHttp: 409 };
      }

      const solicitudId = await this.solicitudRepo.crear(conexion, {
        marcaId: fila.marca_id,
        citaId: fila.id,
        fechaActual,
        horaActual,
        fechaSolicitada: fecha,
        horaInicioSolicitada: horaInicio,
        horaFinSolicitada: horaFin,
      });

      await conexion.commit();

      try {
        const { notificacionServicio } = await import('./notificacionServicio.js');
        await notificacionServicio.registrarSolicitudReagendamiento({
          marcaId: fila.marca_id,
          citaId: fila.id,
          clienteNombre: fila.cliente_nombre,
          servicioNombre: fila.servicio_nombre,
          fechaActual,
          horaActual,
          fechaSolicitada: fecha,
          horaSolicitada: horaInicio,
        });
      } catch {
        // Notificacion opcional
      }

      const cita = await this.mapearCitaPublicaGestion(
        await this.reservaRepo.buscarPorCodigo(codigo)
      );

      return {
        cita,
        solicitudId,
        mensaje: 'Solicitud enviada. El administrador confirmara el nuevo horario.',
      };
    } catch (err) {
      await conexion.rollback();
      throw err;
    } finally {
      conexion.release();
    }
  }
}
