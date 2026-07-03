import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMarca } from '../../../aplicacion/proveedores/ProveedorMarca';
import { obtenerServiciosPublicos } from '../../../modulos/publico_marca/servicios/marcaServicio';
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
  InputTexto,
  MensajeError,
  ModalMensaje,
  SelectorFecha,
  SelectorHora,
  TarjetaServicio,
} from '../../../compartido/componentes';
import { RUTAS_PUBLICAS } from '../../../compartido/constantes';
import { formatearPrecio } from '../../../compartido/utilidades/temaMarca';
import '../../../estilos/publico/reservar/reservar.css';

const PASOS = ['Servicio', 'Fecha y hora', 'Tus datos', 'Confirmar'];

export default function ReservarVista() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { marca, cargando: cargandoMarca } = useMarca();

  const [paso, setPaso] = useState(0);
  const [servicios, setServicios] = useState([]);
  const [servicio, setServicio] = useState(null);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [prefillListo, setPrefillListo] = useState(false);

  const [cargandoServicios, setCargandoServicios] = useState(false);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [erroresCampo, setErroresCampo] = useState({});
  const [modalSinHorarios, setModalSinHorarios] = useState(false);

  function limpiarErrorCampo(campo) {
    setErroresCampo((prev) => {
      if (!prev[campo]) return prev;
      const siguiente = { ...prev };
      delete siguiente[campo];
      return siguiente;
    });
  }

  function mostrarErroresValidacion(errores) {
    setErroresCampo(errores);
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
    obtenerServiciosPublicos(marca.id)
      .then(setServicios)
      .catch(() => setError('No se pudieron cargar los servicios.'))
      .finally(() => setCargandoServicios(false));
  }, [marca?.id]);

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
    if (f && f >= minimo) setFecha(f);
    if (h) setHora(h);

    if (f && h) setPaso(2);
    else if (f) setPaso(1);
    else setPaso(1);

    setPrefillListo(true);
  }, [servicios, searchParams, prefillListo]);

  useEffect(() => {
    if (paso === 1 && servicio && !fecha) {
      setFecha(fechaHoyLocal());
    }
  }, [paso, servicio, fecha]);

  useEffect(() => {
    if (!marca?.id || !servicio?.id || !fecha) {
      setHorarios([]);
      setHora('');
      return;
    }

    setCargandoHorarios(true);
    limpiarErrorGeneral();
    obtenerDisponibilidad(marca.id, servicio.id, fecha)
      .then((datos) => {
        const lista = datos.horarios ?? [];
        setHorarios(lista);
        setHora((prev) => (prev && lista.includes(prev) ? prev : ''));
      })
      .catch((err) => {
        setHorarios([]);
        setError(err.message);
      })
      .finally(() => setCargandoHorarios(false));
  }, [marca?.id, servicio?.id, fecha]);

  function avisarSinHorarios() {
    setModalSinHorarios(true);
  }

  function seleccionarServicio(s) {
    setServicio(s);
    setFecha((prev) => prev || fechaHoyLocal());
    setPaso(1);
    limpiarErrorGeneral();
    limpiarErroresFormulario();
  }

  function avanzarDesdeFechaHora() {
    if (!fecha) {
      setErroresCampo({ fecha: 'Selecciona un dia en el calendario.' });
      limpiarErrorGeneral();
      return;
    }

    if (cargandoHorarios) return;

    if (horarios.length === 0) {
      limpiarErrorGeneral();
      limpiarErroresFormulario();
      avisarSinHorarios();
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

  function avanzarDesdeDatos() {
    const errores = validarDatosCliente({ nombre, telefono, correo });
    if (Object.keys(errores).length > 0) {
      mostrarErroresValidacion(errores);
      limpiarErrorGeneral();
      return;
    }

    limpiarErrorGeneral();
    limpiarErroresFormulario();
    setPaso(3);
  }

  async function confirmarReserva() {
    const erroresCliente = validarDatosCliente({ nombre, telefono, correo });
    if (Object.keys(erroresCliente).length > 0) {
      mostrarErroresValidacion(erroresCliente);
      limpiarErrorGeneral();
      setPaso(2);
      return;
    }

    setEnviando(true);
    limpiarErrorGeneral();
    limpiarErroresFormulario();

    try {
      const confirmacion = await crearReserva({
        marcaId: marca.id,
        servicioId: servicio.id,
        fecha,
        horaInicio: hora,
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        correo: correo.trim().toLowerCase(),
      });

      navigate(RUTAS_PUBLICAS.confirmacion(slug, confirmacion.cita.codigo), {
        state: { confirmacion },
      });
    } catch (err) {
      const apiErrores = err.datos?.errores;
      if (apiErrores && typeof apiErrores === 'object') {
        mostrarErroresValidacion(apiErrores);
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
      <p className="paso-indicador reservar-vista__indicador">
        Paso {paso + 1} de {PASOS.length}
      </p>

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
        </section>
      )}

      {paso === 1 && servicio && (
        <section className="reservar-vista__seccion tarjeta-app">
          <h2>Fecha y hora</h2>
          <p className="reservar-vista__resumen-servicio">
            {servicio.nombre} · {servicio.duracionMinutos} min · {formatearPrecio(servicio.precio)}
          </p>

          <SelectorFecha
            valor={fecha}
            min={fechaHoyLocal()}
            onChange={(valor) => {
              setFecha(valor);
              limpiarErrorCampo('fecha');
              limpiarErrorCampo('hora_inicio');
            }}
            modo="calendario"
            etiqueta="Selecciona un dia"
          />
          {erroresCampo.fecha && (
            <p className="reservar-vista__error-campo">{erroresCampo.fecha}</p>
          )}

          {fecha && (
            <>
              {cargandoHorarios && <Cargando mensaje="Buscando horarios..." />}
              {!cargandoHorarios && horarios.length > 0 && (
                <SelectorHora
                  valor={hora}
                  opciones={horarios}
                  onChange={(valor) => {
                    setHora(valor);
                    limpiarErrorCampo('hora_inicio');
                  }}
                />
              )}
              {erroresCampo.hora_inicio && (
                <p className="reservar-vista__error-campo">{erroresCampo.hora_inicio}</p>
              )}
              {!cargandoHorarios && horarios.length === 0 && (
                <p className="reservar-vista__sin-horarios">
                  No hay horarios disponibles este dia. Elige otra fecha en el calendario.
                </p>
              )}
            </>
          )}

          <div className="reservar-vista__acciones">
            <BotonPrincipal variante="texto" onClick={() => setPaso(0)}>Atras</BotonPrincipal>
            <BotonPrincipal
              onClick={avanzarDesdeFechaHora}
              anchoCompleto
              deshabilitado={cargandoHorarios}
            >
              Continuar
            </BotonPrincipal>
          </div>
        </section>
      )}

      {paso === 2 && (
        <section className="reservar-vista__seccion tarjeta-app">
          <h2>Tus datos</h2>
          <CampoFormulario
            etiqueta="Nombre completo"
            id="nombre"
            requerido
            error={erroresCampo.nombre}
            ayuda="Minimo 2 caracteres. Ejemplo: Maria Lopez"
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
              required
              maxLength={120}
            />
          </CampoFormulario>
          <CampoFormulario
            etiqueta="Telefono"
            id="telefono"
            requerido
            error={erroresCampo.telefono}
            ayuda="Minimo 10 digitos. Puedes usar +57 y espacios."
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
          <CampoFormulario
            etiqueta="Correo electronico"
            id="correo"
            requerido
            error={erroresCampo.correo}
            ayuda="Formato: ejemplo@correo.com"
          >
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => {
                setCorreo(e.target.value);
                limpiarErrorCampo('correo');
              }}
              autoComplete="email"
              placeholder="ejemplo@correo.com"
              required
            />
          </CampoFormulario>
          <div className="reservar-vista__acciones">
            <BotonPrincipal variante="texto" onClick={() => setPaso(1)}>Atras</BotonPrincipal>
            <BotonPrincipal onClick={avanzarDesdeDatos} anchoCompleto>
              Continuar
            </BotonPrincipal>
          </div>
        </section>
      )}

      {paso === 3 && (
        <section className="reservar-vista__seccion tarjeta-app">
          <h2>Confirma tu cita</h2>
          <dl className="reservar-vista__resumen-final">
            <dt>Servicio</dt>
            <dd>{servicio.nombre}</dd>
            <dt>Fecha</dt>
            <dd>{fecha}</dd>
            <dt>Hora</dt>
            <dd>{formatearHoraLegible(hora)}</dd>
            <dt>Nombre</dt>
            <dd>{nombre}</dd>
            <dt>Telefono</dt>
            <dd>{telefono}</dd>
            <dt>Correo</dt>
            <dd>{correo}</dd>
          </dl>
          <div className="reservar-vista__acciones">
            <BotonPrincipal variante="texto" onClick={() => setPaso(2)}>Atras</BotonPrincipal>
            <BotonPrincipal onClick={confirmarReserva} anchoCompleto deshabilitado={enviando}>
              {enviando ? 'Reservando...' : 'Confirmar reserva'}
            </BotonPrincipal>
          </div>
        </section>
      )}
    </div>
  );
}
