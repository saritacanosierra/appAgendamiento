import { useEffect, useState } from 'react';
import {
  BotonPrincipal,
  CampoFormulario,
  Cargando,
  EncabezadoMarca,
  EstadoCita,
  MensajeError,
  ModalConfirmacion,
  ModalMensaje,
  SelectorFecha,
  SelectorHora,
} from '../../../compartido/componentes';
import { useMarca } from '../../../aplicacion/proveedores/ProveedorMarca';
import {
  cancelarCitaPublica,
  consultarCitas,
  obtenerDisponibilidad,
  solicitarReagendamiento,
} from '../../../modulos/reservas/servicios/reservasServicio';
import { formatearHoraLegible } from '../../../modulos/reservas/utilidades/calendarioCliente';
import { formatearPrecio } from '../../../compartido/utilidades/temaMarca';
import { RUTAS_PUBLICAS } from '../../../compartido/constantes';
import { Link } from 'react-router-dom';
import '../../../estilos/publico/mi_cita/mi_cita.css';

function TarjetaCitaCliente({ cita, marcaId, telefono, onActualizar }) {
  const [modoReagendar, setModoReagendar] = useState(false);
  const [fechaNueva, setFechaNueva] = useState('');
  const [horaNueva, setHoraNueva] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mostrarConfirmCancelar, setMostrarConfirmCancelar] = useState(false);
  const [modalMensaje, setModalMensaje] = useState(null);

  useEffect(() => {
    if (!modoReagendar || !fechaNueva || !cita.servicio?.id) {
      setHorarios([]);
      return;
    }

    let cancelado = false;
    setCargandoHorarios(true);
    setModalMensaje(null);

    obtenerDisponibilidad(marcaId, cita.servicio.id, fechaNueva)
      .then((datos) => {
        if (!cancelado) {
          setHorarios(datos.horarios ?? []);
          if (horaNueva && !(datos.horarios ?? []).includes(horaNueva)) {
            setHoraNueva('');
          }
        }
      })
      .catch((err) => {
        if (!cancelado) {
          setModalMensaje({
            titulo: 'Error',
            mensaje: err.message,
            variante: 'error',
          });
        }
      })
      .finally(() => {
        if (!cancelado) setCargandoHorarios(false);
      });

    return () => {
      cancelado = true;
    };
  }, [modoReagendar, fechaNueva, cita.servicio?.id, marcaId, horaNueva]);

  async function ejecutarCancelar() {
    setEnviando(true);
    try {
      await cancelarCitaPublica(marcaId, cita.codigo, telefono);
      setMostrarConfirmCancelar(false);
      setModalMensaje({
        titulo: 'Cita cancelada',
        mensaje: 'Tu cita fue cancelada correctamente.',
        variante: 'exito',
      });
      onActualizar();
    } catch (err) {
      setMostrarConfirmCancelar(false);
      setModalMensaje({
        titulo: 'No se pudo cancelar',
        mensaje: err.message,
        variante: 'error',
      });
    } finally {
      setEnviando(false);
    }
  }

  async function manejarReagendar(e) {
    e.preventDefault();
    if (!fechaNueva || !horaNueva) return;
    setEnviando(true);
    try {
      const resultado = await solicitarReagendamiento(
        marcaId,
        cita.codigo,
        telefono,
        fechaNueva,
        horaNueva
      );
      setModoReagendar(false);
      setModalMensaje({
        titulo: 'Solicitud enviada',
        mensaje: resultado.mensaje ?? 'El administrador confirmara tu nuevo horario pronto.',
        variante: 'exito',
      });
      onActualizar();
    } catch (err) {
      setModalMensaje({
        titulo: 'No se pudo reagendar',
        mensaje: err.message,
        variante: 'error',
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <ModalConfirmacion
        abierto={mostrarConfirmCancelar}
        titulo="Cancelar cita"
        mensaje="¿Seguro que deseas cancelar esta cita? Esta accion no se puede deshacer."
        textoConfirmar="Si, cancelar"
        textoCancelar="Volver"
        onConfirmar={ejecutarCancelar}
        onCancelar={() => setMostrarConfirmCancelar(false)}
      />

      <ModalMensaje
        abierto={Boolean(modalMensaje)}
        titulo={modalMensaje?.titulo ?? ''}
        mensaje={modalMensaje?.mensaje}
        variante={modalMensaje?.variante ?? 'exito'}
        onCerrar={() => setModalMensaje(null)}
      />

      <article className="mi-cita__tarjeta tarjeta-app">
      <header className="mi-cita__tarjeta-cabecera">
        <div>
          <h2>{cita.servicio.nombre}</h2>
          <p className="mi-cita__codigo">Codigo: {cita.codigo}</p>
        </div>
        <EstadoCita estado={cita.estado} />
      </header>

      <dl className="mi-cita__detalle">
        <dt>Fecha y hora</dt>
        <dd>{cita.fecha} · {formatearHoraLegible(cita.horaInicio)}</dd>
        <dt>Precio</dt>
        <dd>{formatearPrecio(cita.servicio.precio)}</dd>
        <dt>Cliente</dt>
        <dd>{cita.cliente.nombre}</dd>
      </dl>

      {cita.solicitudReagendamiento && (
        <div className="mi-cita__pendiente">
          <strong>Reagendamiento pendiente de aprobacion</strong>
          <p>
            Solicitaste: {cita.solicitudReagendamiento.fechaSolicitada} a las{' '}
            {formatearHoraLegible(cita.solicitudReagendamiento.horaInicioSolicitada)}.
            El administrador confirmara pronto.
          </p>
        </div>
      )}

      {cita.mensajeRestriccion && cita.activa && (
        <p className="mi-cita__aviso">{cita.mensajeRestriccion}</p>
      )}

      {cita.activa && (
        <div className="mi-cita__acciones">
          {cita.puedeCancelar && (
            <BotonPrincipal
              type="button"
              variante="secundario"
              onClick={() => setMostrarConfirmCancelar(true)}
              deshabilitado={enviando}
            >
              Cancelar cita
            </BotonPrincipal>
          )}
          {cita.puedeReagendar && (
            <BotonPrincipal
              type="button"
              onClick={() => {
                setModoReagendar((v) => !v);
                setModalMensaje(null);
              }}
              deshabilitado={enviando}
            >
              {modoReagendar ? 'Cerrar reagendar' : 'Reagendar cita'}
            </BotonPrincipal>
          )}
        </div>
      )}

      {modoReagendar && cita.puedeReagendar && (
        <form className="mi-cita__reagendar" onSubmit={manejarReagendar}>
          <p className="mi-cita__reagendar-intro">
            Elige la nueva fecha y hora. El administrador debe aprobar el cambio.
          </p>
          <SelectorFecha valor={fechaNueva} onChange={setFechaNueva} />
          {cargandoHorarios && <p className="mi-cita__hint">Cargando horarios...</p>}
          {!cargandoHorarios && fechaNueva && horarios.length === 0 && (
            <p className="mi-cita__hint">No hay horarios disponibles este dia.</p>
          )}
          <SelectorHora valor={horaNueva} onChange={setHoraNueva} opciones={horarios} />
          <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={enviando || !fechaNueva || !horaNueva}>
            {enviando ? 'Enviando...' : 'Enviar solicitud de reagendamiento'}
          </BotonPrincipal>
        </form>
      )}
    </article>
    </>
  );
}

export default function ConsultarCitaVista() {
  const { marca } = useMarca();
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [resultado, setResultado] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState(null);

  async function buscar(e) {
    e.preventDefault();
    if (!marca?.id) return;
    setBuscando(true);
    setError(null);
    setResultado(null);
    try {
      const datos = await consultarCitas(marca.id, {
        telefono: telefono.replace(/\D+/g, ''),
        correo: correo.trim().toLowerCase(),
      });
      setResultado(datos);
    } catch (err) {
      setError(err.message);
    } finally {
      setBuscando(false);
    }
  }

  async function recargar() {
    if (!marca?.id || !telefono) return;
    try {
      const datos = await consultarCitas(marca.id, {
        telefono: telefono.replace(/\D+/g, ''),
        correo: correo.trim().toLowerCase(),
      });
      setResultado(datos);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mi-cita">
      <EncabezadoMarca marca={marca} compacto />

      <header className="mi-cita__cabecera">
        <h1>Consultar mi cita</h1>
        <p>
          Busca tu reserva con tu telefono y el correo con el que te registraste al reservar.
        </p>
      </header>

      <form className="mi-cita__busqueda tarjeta-app" onSubmit={buscar}>
        <CampoFormulario etiqueta="Telefono" id="mi-cita-tel" requerido>
          <input
            id="mi-cita-tel"
            type="tel"
            inputMode="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="10 digitos"
            required
          />
        </CampoFormulario>
        <CampoFormulario etiqueta="Correo electronico" id="mi-cita-correo" requerido>
          <input
            id="mi-cita-correo"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="ejemplo@correo.com"
            required
          />
        </CampoFormulario>
        <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={buscando}>
          {buscando ? 'Buscando...' : 'Buscar mi cita'}
        </BotonPrincipal>
      </form>

      {error && <MensajeError mensaje={error} />}
      {buscando && <Cargando mensaje="Buscando citas..." />}

      {resultado && !buscando && (
        <section className="mi-cita__resultados">
          {resultado.citas.length === 0 ? (
            <p className="mi-cita__vacio">No encontramos citas activas con esos datos.</p>
          ) : (
            <>
              <p className="mi-cita__resumen">
                {resultado.citas.length === 1 ? '1 cita encontrada' : `${resultado.citas.length} citas encontradas`}.
                Puedes cancelar hasta la hora del servicio.
                {resultado.antelacionReagendarHoras
                  ? ` Reagendar requiere al menos ${resultado.antelacionReagendarHoras} horas de anticipacion.`
                  : ''}
              </p>
              {resultado.citas.map((cita) => (
                <TarjetaCitaCliente
                  key={cita.codigo}
                  cita={cita}
                  marcaId={marca.id}
                  telefono={telefono.replace(/\D+/g, '')}
                  onActualizar={recargar}
                />
              ))}
            </>
          )}
        </section>
      )}

      <p className="mi-cita__enlace-reservar">
        ¿Nueva cita? <Link to={RUTAS_PUBLICAS.reservar(marca?.slug)}>Reservar ahora</Link>
      </p>
    </div>
  );
}
