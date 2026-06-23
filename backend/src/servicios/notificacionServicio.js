import { NotificacionRepositorio } from '../repositorios/notificacionRepositorio.js';

export function mapearNotificacion(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    marcaId: fila.marca_id,
    tipo: fila.tipo,
    titulo: fila.titulo,
    mensaje: fila.mensaje,
    leida: Boolean(fila.leida),
    referenciaTipo: fila.referencia_tipo,
    referenciaId: fila.referencia_id,
    createdAt: fila.created_at,
  };
}

export class NotificacionServicio {
  constructor(repo = new NotificacionRepositorio()) {
    this.repo = repo;
  }

  async listar(marcaId, opciones = {}) {
    const filas = await this.repo.listarPorMarca(marcaId, opciones);
    return filas.map(mapearNotificacion);
  }

  async resumen(marcaId) {
    const [noLeidas, recientes] = await Promise.all([
      this.repo.contarNoLeidas(marcaId),
      this.repo.listarPorMarca(marcaId, { limite: 5 }),
    ]);

    return {
      noLeidas,
      recientes: recientes.map(mapearNotificacion),
    };
  }

  async registrar(datos) {
    const id = await this.repo.crear(datos);
    const fila = await this.repo.buscarPorId(datos.marcaId, id);
    return mapearNotificacion(fila);
  }

  async registrarNuevaCita({ marcaId, citaId, origen, clienteNombre, servicioNombre, fecha, horaInicio }) {
    const esPublica = origen === 'publica';
    return this.registrar({
      marcaId,
      tipo: esPublica ? 'nueva_reserva_publica' : 'nueva_cita_admin',
      titulo: esPublica ? 'Nueva reserva en linea' : 'Cita creada manualmente',
      mensaje: `${clienteNombre} — ${servicioNombre}, ${fecha} a las ${horaInicio}`,
      referenciaTipo: 'cita',
      referenciaId: citaId,
    });
  }

  async marcarLeida(marcaId, id) {
    const ok = await this.repo.marcarLeida(marcaId, id);
    if (!ok) return { error: 'Notificacion no encontrada.', codigoHttp: 404 };
    const fila = await this.repo.buscarPorId(marcaId, id);
    return { notificacion: mapearNotificacion(fila) };
  }

  async marcarTodasLeidas(marcaId) {
    await this.repo.marcarTodasLeidas(marcaId);
    return { ok: true };
  }
}

export const notificacionServicio = new NotificacionServicio();
