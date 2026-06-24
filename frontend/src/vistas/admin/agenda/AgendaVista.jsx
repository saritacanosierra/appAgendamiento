import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BotonPrincipal,
  Cargando,
  MensajeError,
  ModalConfirmacion,
  ModalMensaje,
  SelectorFecha,
} from '../../../compartido/componentes';
import { RUTAS_ADMIN } from '../../../compartido/constantes';
import { fechaHoyLocal } from '../../../modulos/reservas/utilidades/calendarioCliente';
import FormularioCitaAdmin from '../../../componentes/admin/formulario_cita_admin/FormularioCitaAdmin';
import TarjetaCitaAdmin from '../../../componentes/admin/tarjeta_cita_admin/TarjetaCitaAdmin';
import { emitirActualizacionNotificaciones } from '../../../componentes/admin/campana_notificaciones/CampanaNotificacionesAdmin';
import {
  actualizarCita,
  cancelarCita,
  obtenerAgenda,
} from '../../../modulos/agenda/servicios/agendaServicio';
import {
  aprobarSolicitudReagendamiento,
  listarSolicitudesReagendamiento,
  rechazarSolicitudReagendamiento,
} from '../../../modulos/agenda/servicios/solicitudesReagendamientoServicio';
import { formatearHoraLegible } from '../../../modulos/reservas/utilidades/calendarioCliente';
import { mensajeErrorPanelAdmin } from '../../../compartido/utilidades/erroresAdmin';
import { useCitaEnCurso, limpiarCronometroSiEsCita } from '../../../modulos/atencion/hooks/useCronometro';
import '../../../estilos/admin/agenda/agenda.css';

export default function AgendaVista() {
  const navigate = useNavigate();
  const [fecha, setFecha] = useState(fechaHoyLocal());
  const [vista, setVista] = useState('dia');
  const [agenda, setAgenda] = useState(null);
  const citaIdEnCurso = useCitaEnCurso(agenda?.citas);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarFormCita, setMostrarFormCita] = useState(false);
  const [solicitudes, setSolicitudes] = useState([]);
  const [procesandoSolicitud, setProcesandoSolicitud] = useState(null);
  const [modalConfirmacion, setModalConfirmacion] = useState(null);
  const [modalMensaje, setModalMensaje] = useState(null);

  const cargarSolicitudes = useCallback(async () => {
    try {
      const datos = await listarSolicitudesReagendamiento();
      setSolicitudes(Array.isArray(datos) ? datos : []);
    } catch {
      setSolicitudes([]);
    }
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerAgenda(fecha, vista);
      setAgenda(datos);
    } catch (err) {
      setError(mensajeErrorPanelAdmin(err));
    } finally {
      setCargando(false);
    }
  }, [fecha, vista]);

  useEffect(() => {
    cargar();
    cargarSolicitudes();
  }, [cargar, cargarSolicitudes]);

  async function ejecutarAprobar(solicitud) {
    setProcesandoSolicitud(solicitud.id);
    setError(null);
    try {
      await aprobarSolicitudReagendamiento(solicitud.id);
      await Promise.all([cargar(), cargarSolicitudes()]);
      emitirActualizacionNotificaciones();
      setModalMensaje({
        titulo: 'Reagendamiento aprobado',
        mensaje: `La cita de ${solicitud.cliente.nombre} quedo en ${solicitud.fechaSolicitada} a las ${formatearHoraLegible(solicitud.horaInicioSolicitada)}.`,
        variante: 'exito',
      });
    } catch (err) {
      setModalMensaje({
        titulo: 'No se pudo aprobar',
        mensaje: err.message,
        variante: 'error',
      });
    } finally {
      setProcesandoSolicitud(null);
    }
  }

  async function ejecutarRechazar(solicitud) {
    setProcesandoSolicitud(solicitud.id);
    setError(null);
    try {
      await rechazarSolicitudReagendamiento(solicitud.id);
      await cargarSolicitudes();
      emitirActualizacionNotificaciones();
      setModalMensaje({
        titulo: 'Solicitud rechazada',
        mensaje: `Se rechazo el reagendamiento de ${solicitud.cliente.nombre}. La cita original se mantiene.`,
        variante: 'info',
      });
    } catch (err) {
      setModalMensaje({
        titulo: 'No se pudo rechazar',
        mensaje: err.message,
        variante: 'error',
      });
    } finally {
      setProcesandoSolicitud(null);
    }
  }

  function pedirAprobar(solicitud) {
    setModalConfirmacion({
      titulo: 'Aprobar reagendamiento',
      mensaje: `${solicitud.cliente.nombre} solicita cambiar de ${solicitud.fechaActual} ${formatearHoraLegible(solicitud.horaActual)} a ${solicitud.fechaSolicitada} ${formatearHoraLegible(solicitud.horaInicioSolicitada)}. ¿Confirmas el nuevo horario?`,
      textoConfirmar: 'Aprobar',
      onConfirmar: () => {
        setModalConfirmacion(null);
        ejecutarAprobar(solicitud);
      },
    });
  }

  function pedirRechazar(solicitud) {
    setModalConfirmacion({
      titulo: 'Rechazar solicitud',
      mensaje: `¿Rechazar el reagendamiento de ${solicitud.cliente.nombre}? La cita actual no cambiara.`,
      textoConfirmar: 'Rechazar',
      onConfirmar: () => {
        setModalConfirmacion(null);
        ejecutarRechazar(solicitud);
      },
    });
  }

  async function confirmarCita(cita) {
    try {
      await actualizarCita(cita.id, { estado: 'confirmada' });
      cargar();
      emitirActualizacionNotificaciones();
      setModalMensaje({
        titulo: 'Cita confirmada',
        mensaje: `La cita de ${cita.cliente.nombre} quedo confirmada.`,
        variante: 'exito',
      });
    } catch (err) {
      setModalMensaje({
        titulo: 'Error',
        mensaje: err.message,
        variante: 'error',
      });
    }
  }

  async function ejecutarCancelarCita(cita) {
    try {
      await cancelarCita(cita.id);
      limpiarCronometroSiEsCita(cita.id);
      cargar();
      emitirActualizacionNotificaciones();
      setModalMensaje({
        titulo: 'Cita cancelada',
        mensaje: `La cita de ${cita.cliente.nombre} fue cancelada.`,
        variante: 'info',
      });
    } catch (err) {
      setModalMensaje({
        titulo: 'Error',
        mensaje: err.message,
        variante: 'error',
      });
    }
  }

  function pedirCancelarDesdeSolicitud(solicitud) {
    setModalConfirmacion({
      titulo: 'Cancelar cita',
      mensaje: `¿Cancelar la cita de ${solicitud.cliente.nombre} el ${solicitud.fechaActual} a las ${formatearHoraLegible(solicitud.horaActual)}? La solicitud de reagendamiento tambien se cerrara.`,
      textoConfirmar: 'Cancelar cita',
      onConfirmar: () => {
        setModalConfirmacion(null);
        ejecutarCancelarDesdeSolicitud(solicitud);
      },
    });
  }

  async function ejecutarCancelarDesdeSolicitud(solicitud) {
    setProcesandoSolicitud(solicitud.id);
    setError(null);
    try {
      await cancelarCita(solicitud.citaId);
      limpiarCronometroSiEsCita(solicitud.citaId);
      await Promise.all([cargar(), cargarSolicitudes()]);
      emitirActualizacionNotificaciones();
      setModalMensaje({
        titulo: 'Cita cancelada',
        mensaje: `La cita de ${solicitud.cliente.nombre} fue cancelada y la solicitud de reagendamiento se cerro.`,
        variante: 'info',
      });
    } catch (err) {
      setModalMensaje({
        titulo: 'Error',
        mensaje: err.message,
        variante: 'error',
      });
    } finally {
      setProcesandoSolicitud(null);
    }
  }

  function pedirCancelarCita(cita) {
    setModalConfirmacion({
      titulo: 'Cancelar cita',
      mensaje: `¿Cancelar la cita de ${cita.cliente.nombre} el ${cita.fecha} a las ${cita.horaInicio}?`,
      textoConfirmar: 'Cancelar cita',
      onConfirmar: () => {
        setModalConfirmacion(null);
        ejecutarCancelarCita(cita);
      },
    });
  }

  function irAtenderCita(cita) {
    navigate(RUTAS_ADMIN.atencionCita(cita.id, cita.fecha));
  }

  function cambiarDia(offset) {
    const [y, m, d] = fecha.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + offset);
    const pad = (n) => String(n).padStart(2, '0');
    setFecha(`${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`);
  }

  return (
    <div className="agenda-vista">
      <ModalConfirmacion
        abierto={Boolean(modalConfirmacion)}
        titulo={modalConfirmacion?.titulo ?? ''}
        mensaje={modalConfirmacion?.mensaje}
        textoConfirmar={modalConfirmacion?.textoConfirmar ?? 'Confirmar'}
        onConfirmar={modalConfirmacion?.onConfirmar ?? (() => setModalConfirmacion(null))}
        onCancelar={() => setModalConfirmacion(null)}
      />

      <ModalMensaje
        abierto={Boolean(modalMensaje)}
        titulo={modalMensaje?.titulo ?? ''}
        mensaje={modalMensaje?.mensaje}
        variante={modalMensaje?.variante ?? 'exito'}
        onCerrar={() => setModalMensaje(null)}
      />

      <header className="agenda-vista__cabecera">
        <h1>Agenda</h1>
        <div className="agenda-vista__cabecera-acciones">
          <div className="agenda-vista__tabs">
            <button
              type="button"
              className={vista === 'dia' ? 'activo' : ''}
              onClick={() => setVista('dia')}
            >
              Dia
            </button>
            <button
              type="button"
              className={vista === 'semana' ? 'activo' : ''}
              onClick={() => setVista('semana')}
            >
              Semana
            </button>
          </div>
          <BotonPrincipal onClick={() => setMostrarFormCita(!mostrarFormCita)}>
            {mostrarFormCita ? 'Cerrar' : '+ Nueva cita'}
          </BotonPrincipal>
        </div>
      </header>

      {mostrarFormCita && (
        <FormularioCitaAdmin
          fechaInicial={fecha}
          onCreada={() => {
            setMostrarFormCita(false);
            cargar();
            emitirActualizacionNotificaciones();
            setModalMensaje({
              titulo: 'Cita creada',
              mensaje: 'La nueva cita se agrego a la agenda.',
              variante: 'exito',
            });
          }}
          onCancelar={() => setMostrarFormCita(false)}
        />
      )}

      {solicitudes.length > 0 && (
        <section className="agenda-vista__solicitudes">
          <h2>Reagendamientos pendientes ({solicitudes.length})</h2>
          <p className="agenda-vista__solicitudes-aviso">
            Aprueba o rechaza el nuevo horario, o cancela la cita si ya no procede. Tambien recibiras aviso en la campana 🔔.
          </p>
          <div className="agenda-vista__solicitudes-lista">
            {solicitudes.map((solicitud) => (
              <article key={solicitud.id} className="agenda-vista__solicitud">
                <div>
                  <strong>{solicitud.cliente.nombre}</strong> — {solicitud.servicio.nombre}
                  <p>
                    Actual: {solicitud.fechaActual} {formatearHoraLegible(solicitud.horaActual)}
                    {' → '}
                    Solicita: {solicitud.fechaSolicitada}{' '}
                    {formatearHoraLegible(solicitud.horaInicioSolicitada)}
                  </p>
                  <p className="agenda-vista__solicitud-codigo">Codigo: {solicitud.codigoConfirmacion}</p>
                </div>
                <div className="agenda-vista__solicitud-acciones">
                  <BotonPrincipal
                    type="button"
                    onClick={() => pedirAprobar(solicitud)}
                    deshabilitado={procesandoSolicitud === solicitud.id}
                  >
                    Aprobar
                  </BotonPrincipal>
                  <BotonPrincipal
                    type="button"
                    variante="secundario"
                    onClick={() => pedirRechazar(solicitud)}
                    deshabilitado={procesandoSolicitud === solicitud.id}
                  >
                    Rechazar
                  </BotonPrincipal>
                  <BotonPrincipal
                    type="button"
                    variante="texto"
                    className="agenda-vista__solicitud-cancelar"
                    onClick={() => pedirCancelarDesdeSolicitud(solicitud)}
                    deshabilitado={procesandoSolicitud === solicitud.id}
                  >
                    Cancelar cita
                  </BotonPrincipal>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="agenda-vista__navegacion">
        <div className="agenda-vista__calendario">
          <SelectorFecha valor={fecha} onChange={setFecha} etiqueta="Fecha" />
        </div>
        <div className="agenda-vista__navegacion-botones">
          <BotonPrincipal variante="texto" onClick={() => cambiarDia(vista === 'dia' ? -1 : -7)}>
            ← Anterior
          </BotonPrincipal>
          <BotonPrincipal variante="texto" onClick={() => cambiarDia(vista === 'dia' ? 1 : 7)}>
            Siguiente →
          </BotonPrincipal>
        </div>
      </div>

      {agenda?.resumen && (
        <div className="agenda-vista__resumen">
          <span>{agenda.resumen.total} citas</span>
          <span>{agenda.resumen.pendientes} pendientes</span>
          <span>{agenda.resumen.confirmadas} confirmadas</span>
        </div>
      )}

      {error && <MensajeError mensaje={error} onReintentar={cargar} />}
      {cargando && <Cargando />}

      {!cargando && agenda && (
        <div className="agenda-vista__lista">
          {agenda.citas.length === 0 ? (
            <p className="agenda-vista__vacio">No hay citas en este periodo.</p>
          ) : (
            agenda.citas.map((cita) => (
              <div key={cita.id}>
                {vista === 'semana' && (
                  <p className="agenda-vista__fecha-grupo">{cita.fecha}</p>
                )}
                <TarjetaCitaAdmin
                  cita={cita}
                  enCurso={cita.id === citaIdEnCurso}
                  onConfirmar={confirmarCita}
                  onCancelar={pedirCancelarCita}
                  onAtender={irAtenderCita}
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
