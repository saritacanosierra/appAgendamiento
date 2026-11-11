import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMarca } from '../../../aplicacion/proveedores/ProveedorMarca';
import PruebaSocialGaleria from '../../../componentes/publico/prueba_social_galeria/PruebaSocialGaleria';
import { listarGaleriaPublica } from '../../../modulos/galeria/servicios/galeriaServicio';
import { obtenerServiciosPublicos } from '../../../modulos/publico_marca/servicios/marcaServicio';
import { listarEstilistasPublicas } from '../../../modulos/reservas/servicios/estilistasServicio';
import {
  crearReserva,
  obtenerDisponibilidad,
} from '../../../modulos/reservas/servicios/reservasServicio';
import { fechaHoyLocal, formatearFechaLegible, formatearHoraLegible } from '../../../modulos/reservas/utilidades/calendarioCliente';
import {
  pasoParaErroresApi,
  validarDatosCliente,
} from '../../../modulos/reservas/utilidades/validarReserva';
import {
  BotonPrincipal,
  CampoFormulario,
  Cargando,
  EncabezadoMarca,
  HorariosDisponiblesDia,
  InputTexto,
  MensajeError,
  ModalMensaje,
  TarjetaServicio,
} from '../../../compartido/componentes';
import { RUTAS_PUBLICAS } from '../../../compartido/constantes';
import { formatearPrecio } from '../../../compartido/utilidades/temaMarca';
import { resolverUrlMedia } from '../../../compartido/utilidades/resolverUrlMedia';
import '../../../estilos/publico/reservar/reservar.css';

const PASOS = ['Servicio', 'Profesional', 'Datos'];

function ResumenCita({ servicio, fecha, hora, estilista, onCambiarHora }) {
  return (
    <dl className="reservar-vista__cita">
      <div>
        <dt>Servicio</dt>
        <dd>
          <strong>{servicio.nombre}</strong>
          <span>{servicio.duracionMinutos} min · {formatearPrecio(servicio.precio)}</span>
        </dd>
      </div>
      {hora ? (
        <div>
          <dt>Cuando</dt>
          <dd>
            <strong>{formatearHoraLegible(hora)}</strong>
            <span>{formatearFechaLegible(fecha)}</span>
            {onCambiarHora ? (
              <button type="button" className="reservar-vista__cambiar" onClick={onCambiarHora}>
                Cambiar
              </button>
            ) : null}
          </dd>
        </div>
      ) : null}
      {estilista ? (
        <div>
          <dt>Con</dt>
          <dd>
            <strong>{estilista.nombre}</strong>
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

function OpcionEstilista({ item, activa, onElegir }) {
  const [fotoRota, setFotoRota] = useState(false);
  const inicial = (item.nombre || '?').trim().charAt(0).toUpperCase();
  const habilidad = Array.isArray(item.habilidades) ? item.habilidades[0] : '';
  const foto = !fotoRota && item.foto ? resolverUrlMedia(item.foto) : '';

  return (
    <button
      type="button"
      className={activa ? 'reservar-vista__estilista reservar-vista__estilista--activa' : 'reservar-vista__estilista'}
      aria-pressed={activa}
      onClick={onElegir}
    >
      <span className="reservar-vista__avatar">
        {foto ? (
          <img src={foto} alt="" onError={() => setFotoRota(true)} />
        ) : (
          inicial
        )}
      </span>
      <span className="reservar-vista__estilista-texto">
        <strong>{item.nombre}</strong>
        {habilidad ? <em>{habilidad}</em> : null}
      </span>
      <span className="reservar-vista__marca" aria-hidden="true" />
    </button>
  );
}

export default function ReservarVista() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { marca, cargando: cargandoMarca } = useMarca();

  const [paso, setPaso] = useState(0);
  const [servicios, setServicios] = useState([]);
  const [estilistas, setEstilistas] = useState([]);
  const [disenos, setDisenos] = useState([]);
  const [servicio, setServicio] = useState(null);
  const [estilista, setEstilista] = useState(null);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [prefillListo, setPrefillListo] = useState(false);
  const [horaConfirmada, setHoraConfirmada] = useState(false);
  const [cambiandoHora, setCambiandoHora] = useState(false);

  const [cargandoServicios, setCargandoServicios] = useState(false);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [erroresCampo, setErroresCampo] = useState({});
  const [modalSinHorarios, setModalSinHorarios] = useState(false);

  const requiereEstilista = estilistas.length > 0;

  function limpiarErrorCampo(campo) {
    setErroresCampo((prev) => {
      if (!prev[campo]) return prev;
      const siguiente = { ...prev };
      delete siguiente[campo];
      return siguiente;
    });
  }

  function limpiarErrorGeneral() {
    setError(null);
  }

  function limpiarErroresFormulario() {
    setErroresCampo({});
  }

  useEffect(() => {
    if (!marca?.id) return;
    setCargandoServicios(true);
    Promise.all([
      obtenerServiciosPublicos(marca.id),
      listarEstilistasPublicas(marca.id).catch(() => []),
      listarGaleriaPublica(marca.id).catch(() => []),
    ])
      .then(([listaServicios, listaEstilistas, listaDisenos]) => {
        setServicios(listaServicios);
        setEstilistas(Array.isArray(listaEstilistas) ? listaEstilistas : []);
        setDisenos(Array.isArray(listaDisenos) ? listaDisenos : []);
      })
      .catch(() => setError('No se pudieron cargar los servicios.'))
      .finally(() => setCargandoServicios(false));
  }, [marca?.id]);

  useEffect(() => {
    if (estilista || estilistas.length === 0) return;
    const id = searchParams.get('estilista');
    if (!id) return;
    const encontrada = estilistas.find((item) => String(item.id) === String(id));
    if (encontrada) setEstilista(encontrada);
  }, [estilistas, searchParams, estilista]);

  useEffect(() => {
    if (!servicios.length || prefillListo) return;

    const sid = searchParams.get('servicio');
    const f = searchParams.get('fecha');
    const h = searchParams.get('hora');

    if (!sid) {
      setPrefillListo(true);
      return;
    }

    const seleccionado = servicios.find((s) => String(s.id) === String(sid));
    if (!seleccionado) {
      setPrefillListo(true);
      return;
    }

    setServicio(seleccionado);
    const minimo = fechaHoyLocal();
    const fechaValida = Boolean(f && f >= minimo);
    const horaLista = Boolean(fechaValida && h);
    if (fechaValida) setFecha(f);
    if (h) setHora(h);
    if (horaLista) setHoraConfirmada(true);
    setPaso(horaLista && !requiereEstilista ? 2 : 1);
    setPrefillListo(true);
  }, [servicios, searchParams, prefillListo]);

  useEffect(() => {
    if (paso === 1 && servicio && !fecha) {
      setFecha(fechaHoyLocal());
    }
  }, [paso, servicio, fecha]);

  useEffect(() => {
    if (!marca?.id || !servicio?.id || !fecha || (requiereEstilista && !estilista?.id)) {
      setHorarios([]);
      return;
    }

    setCargandoHorarios(true);
    limpiarErrorGeneral();
    obtenerDisponibilidad(marca.id, servicio.id, fecha, estilista?.id ?? null)
      .then((datos) => {
        const lista = datos.horarios ?? [];
        setHorarios(lista);
        setHora((prev) => (prev && lista.includes(prev) ? prev : ''));
        if (hora && !lista.includes(hora)) setHoraConfirmada(false);
      })
      .catch((err) => {
        setHorarios([]);
        setError(err.message);
      })
      .finally(() => setCargandoHorarios(false));
  }, [marca?.id, servicio?.id, fecha, estilista?.id, requiereEstilista]);

  useEffect(() => {
    if (estilistas.length !== 1 || estilista) return;
    setEstilista(estilistas[0]);
  }, [estilistas, estilista]);

  useEffect(() => {
    if (paso !== 1 || !horaConfirmada || !hora || cargandoHorarios) return;
    if (estilistas.length !== 1 || !horarios.includes(hora)) return;
    setPaso(2);
  }, [paso, horaConfirmada, hora, cargandoHorarios, estilistas.length, horarios]);

  function seleccionarServicio(s) {
    setServicio(s);
    setFecha((prev) => prev || fechaHoyLocal());
    setPaso(1);
    limpiarErrorGeneral();
    limpiarErroresFormulario();
  }

  function avanzarDesdeFechaHora() {
    if (requiereEstilista && !estilista) {
      setErroresCampo({ estilista_id: 'Elige con quién quieres tu cita.' });
      limpiarErrorGeneral();
      return;
    }

    if (!fecha) {
      setErroresCampo({ fecha: 'Selecciona un dia en el calendario.' });
      limpiarErrorGeneral();
      return;
    }

    if (cargandoHorarios) return;

    if (horarios.length === 0) {
      limpiarErrorGeneral();
      limpiarErroresFormulario();
      setModalSinHorarios(true);
      return;
    }

    if (!hora) {
      setErroresCampo({ hora_inicio: 'Selecciona un horario disponible de la lista.' });
      limpiarErrorGeneral();
      return;
    }

    limpiarErrorGeneral();
    limpiarErroresFormulario();
    setPaso(2);
  }

  async function confirmarReserva() {
    const erroresCliente = validarDatosCliente({ nombre, telefono });
    if (Object.keys(erroresCliente).length > 0) {
      setErroresCampo(erroresCliente);
      limpiarErrorGeneral();
      return;
    }

    setEnviando(true);
    limpiarErrorGeneral();
    limpiarErroresFormulario();

    try {
      const confirmacion = await crearReserva({
        marcaId: marca.id,
        servicioId: servicio.id,
        estilistaId: estilista?.id ?? null,
        fecha,
        horaInicio: hora,
        nombre: nombre.trim(),
        telefono: telefono.trim(),
      });

      navigate(RUTAS_PUBLICAS.confirmacion(slug, confirmacion.cita.codigo), {
        state: { confirmacion },
      });
    } catch (err) {
      const apiErrores = err.datos?.errores;
      if (apiErrores && typeof apiErrores === 'object') {
        setErroresCampo(apiErrores);
        limpiarErrorGeneral();
        const pasoError = pasoParaErroresApi(apiErrores);
        if (pasoError !== null) setPaso(pasoError);
      } else {
        setError(err.message ?? 'No se pudo completar la reserva.');
        limpiarErroresFormulario();
      }
    } finally {
      setEnviando(false);
    }
  }

  if (cargandoMarca) return <Cargando />;

  return (
    <div className="reservar-vista">
      <ModalMensaje
        abierto={modalSinHorarios}
        titulo="Sin horarios disponibles"
        mensaje={
          fecha
            ? `No hay horarios disponibles para ${formatearFechaLegible(fecha)}. Elige otro dia en el calendario.`
            : 'No hay horarios disponibles este dia. Elige otro dia en el calendario.'
        }
        variante="info"
        onCerrar={() => setModalSinHorarios(false)}
        textoCerrar="Entendido"
      />

      <EncabezadoMarca marca={marca} compacto />

      <p className="reservar-vista__titulo">Agendar cita</p>
      <ol className="reservar-vista__pasos-visuales" aria-label="Pasos de la reserva">
        {PASOS.map((nombrePaso, indice) => (
          <li
            key={nombrePaso}
            className={[
              'reservar-vista__paso',
              indice === paso ? 'reservar-vista__paso--activo' : '',
              indice < paso ? 'reservar-vista__paso--hecho' : '',
            ].filter(Boolean).join(' ')}
          >
            <span>{indice + 1}</span>
            {nombrePaso}
          </li>
        ))}
      </ol>

      {error && paso !== 2 && <MensajeError mensaje={error} />}

      {paso === 0 && (
        <section className="reservar-vista__seccion tarjeta-app">
          <h2>Elige un servicio</h2>
          {cargandoServicios && <Cargando mensaje="Cargando servicios..." />}
          <div className="reservar-vista__lista">
            {servicios.map((s) => (
              <TarjetaServicio key={s.id} servicio={s} onSeleccionar={seleccionarServicio} />
            ))}
          </div>
          <PruebaSocialGaleria disenos={disenos} titulo="Trabajos reales del salon" />
        </section>
      )}

      {paso === 1 && servicio && (
        <section className="reservar-vista__seccion tarjeta-app">
          <h2>
            {cambiandoHora
              ? 'Elige otra hora'
              : horaConfirmada && hora && requiereEstilista
                ? '¿Con quién?'
                : 'Elige la hora'}
          </h2>
          <ResumenCita
            servicio={servicio}
            fecha={fecha}
            hora={hora}
            estilista={estilista}
            onCambiarHora={horaConfirmada && hora && !cambiandoHora ? () => setCambiandoHora(true) : null}
          />

          {cambiandoHora || !(horaConfirmada && hora) ? (
            <div className="reservar-vista__cambio-hora">
              <HorariosDisponiblesDia
                marcaId={marca.id}
                servicios={[servicio]}
                ocultarServicio
                fechaInicial={fecha}
                estilistaId={estilista?.id ?? null}
                onElegirHorario={(_servicio, nuevaFecha, nuevaHora) => {
                  setFecha(nuevaFecha);
                  setHora(nuevaHora);
                  setHoraConfirmada(true);
                  setCambiandoHora(false);
                  limpiarErrorCampo('fecha');
                  limpiarErrorCampo('hora_inicio');
                }}
              />
              {cambiandoHora && hora ? (
                <BotonPrincipal variante="texto" onClick={() => setCambiandoHora(false)}>
                  Mantener esta hora
                </BotonPrincipal>
              ) : null}
            </div>
          ) : requiereEstilista ? (
            <div className="reservar-vista__estilistas" role="listbox" aria-label="Estilistas">
              {estilistas.map((item) => (
                <OpcionEstilista
                  key={item.id}
                  item={item}
                  activa={estilista?.id === item.id}
                  onElegir={() => {
                    setEstilista(item);
                    limpiarErrorCampo('estilista_id');
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="reservar-vista__equipo">El equipo del salon atiende este horario. Elige el dia y la hora.</p>
          )}
          {erroresCampo.estilista_id && !cambiandoHora && horaConfirmada && hora && (
            <p className="reservar-vista__error-campo">{erroresCampo.estilista_id}</p>
          )}

          {horaConfirmada && hora && !cambiandoHora && (
          <div className="reservar-vista__acciones">
            <BotonPrincipal
              variante="texto"
              onClick={() => {
                if (searchParams.get('servicio')) {
                  navigate(RUTAS_PUBLICAS.citas(slug));
                  return;
                }
                setPaso(0);
              }}
            >
              Atras
            </BotonPrincipal>
            <BotonPrincipal
              onClick={avanzarDesdeFechaHora}
              anchoCompleto
              deshabilitado={cargandoHorarios}
            >
              Continuar
            </BotonPrincipal>
          </div>
          )}
        </section>
      )}

      {paso === 2 && servicio && (
        <section className="reservar-vista__seccion tarjeta-app">
          <h2>Tus datos</h2>
          <ResumenCita servicio={servicio} fecha={fecha} hora={hora} estilista={estilista} />
          <div className="reservar-vista__datos">
            <CampoFormulario
              etiqueta="Nombre completo"
              id="nombre"
              requerido
              error={erroresCampo.nombre}
            >
              <InputTexto
                id="nombre"
                capitalizar="palabras"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  limpiarErrorCampo('nombre');
                }}
                autoComplete="name"
                placeholder="Maria Lopez"
                required
                maxLength={120}
              />
            </CampoFormulario>
            <CampoFormulario
              etiqueta="Celular"
              id="telefono"
              requerido
              error={erroresCampo.telefono}
            >
              <input
                id="telefono"
                type="tel"
                inputMode="tel"
                value={telefono}
                onChange={(e) => {
                  setTelefono(e.target.value);
                  limpiarErrorCampo('telefono');
                }}
                autoComplete="tel"
                placeholder="300 123 4567"
                required
              />
            </CampoFormulario>
          </div>
          {error && <MensajeError mensaje={error} />}
          <div className="reservar-vista__acciones">
            <BotonPrincipal variante="texto" onClick={() => setPaso(1)}>Atras</BotonPrincipal>
            <BotonPrincipal onClick={confirmarReserva} anchoCompleto deshabilitado={enviando}>
              {enviando ? 'Reservando...' : 'Confirmar reserva'}
            </BotonPrincipal>
          </div>
        </section>
      )}
    </div>
  );
}
