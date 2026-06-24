import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMarca } from '../../../aplicacion/proveedores/ProveedorMarca';
import {
  Cargando,
  EncabezadoMarca,
  GaleriaFiltrosAcordeon,
  IconoApp,
  ImagenAmpliable,
  MensajeError,
  ModalAccesoGaleria,
} from '../../../compartido/componentes';
import {
  listarCatalogoGaleriaPublica,
  listarGaleriaPublica,
} from '../../../modulos/galeria/servicios/galeriaServicio';
import {
  agregarSeleccionGaleria,
  iniciarSesionGaleria,
  listarSeleccionesGaleria,
  quitarSeleccionGaleria,
} from '../../../modulos/galeria/servicios/galeriaSeleccionServicio';
import {
  categoriasUnicas,
  etiquetaDesdeCatalogo,
  filtrarDisenosGaleria,
  temporadasUnicas,
} from '../../../modulos/galeria/utilidades/filtrarDisenosGaleria';
import { formatearFechaLegible } from '../../../modulos/reservas/utilidades/calendarioCliente';
import {
  guardarTelefonoLocalMarca,
  leerTelefonoLocalMarca,
} from '../../../modulos/reservas/utilidades/credencialesMiCita';
import '../../../estilos/publico/galeria/galeria.css';

function elegirCitaInicial(citas, citaParam, servicioParam) {
  if (citaParam) {
    return citas.find((c) => String(c.id) === String(citaParam)) ?? null;
  }
  if (servicioParam) {
    return citas.find((c) => String(c.servicio.id) === String(servicioParam)) ?? null;
  }
  return null;
}

export default function GaleriaPublicaVista() {
  const { marca, cargando: cargandoMarca, error: errorMarca } = useMarca();
  const [searchParams] = useSearchParams();
  const citaParam = searchParams.get('cita');
  const servicioParam = searchParams.get('servicio');

  const [disenos, setDisenos] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [temporada, setTemporada] = useState('todas');
  const [tendencia, setTendencia] = useState('todas');

  const [modalAccesoAbierto, setModalAccesoAbierto] = useState(false);
  const [restaurandoSesion, setRestaurandoSesion] = useState(true);
  const [modalCargando, setModalCargando] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [citasDisponibles, setCitasDisponibles] = useState([]);
  const [citaPendiente, setCitaPendiente] = useState(null);
  const [citaActiva, setCitaActiva] = useState(null);
  const [telefonoSesion, setTelefonoSesion] = useState('');
  const [seleccionados, setSeleccionados] = useState([]);
  const [toggleandoId, setToggleandoId] = useState(null);
  const sesionRestauradaRef = useRef(false);

  const sesionActiva = Boolean(citaActiva && telefonoSesion);
  const telefonoGuardado = useMemo(
    () => (marca?.id ? leerTelefonoLocalMarca(marca.id) : null),
    [marca?.id]
  );

  useEffect(() => {
    if (!marca?.id) return;

    setCargando(true);
    Promise.all([
      listarGaleriaPublica(marca.id),
      listarCatalogoGaleriaPublica(marca.id),
    ])
      .then(([disenosData, catalogoData]) => {
        setDisenos(Array.isArray(disenosData) ? disenosData : []);
        setCatalogo(Array.isArray(catalogoData) ? catalogoData : []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [marca?.id]);

  const categorias = useMemo(
    () => categoriasUnicas(disenos, catalogo),
    [disenos, catalogo]
  );
  const temporadas = useMemo(
    () => temporadasUnicas(disenos, catalogo),
    [disenos, catalogo]
  );

  const disenosFiltrados = useMemo(
    () => filtrarDisenosGaleria(disenos, {
      busqueda,
      categoria,
      temporada,
      tendencia,
      catalogo,
    }),
    [disenos, busqueda, categoria, temporada, tendencia, catalogo]
  );

  const hayFiltros = Boolean(busqueda.trim())
    || categoria !== 'todas'
    || temporada !== 'todas'
    || tendencia !== 'todas';

  const cargarSelecciones = useCallback(async (telefono, cita) => {
    const datos = await listarSeleccionesGaleria(marca.id, {
      telefono,
      citaId: cita.id,
    });
    setSeleccionados(datos.disenoIds ?? []);
  }, [marca?.id]);

  async function activarSesion(telefono, cita) {
    setTelefonoSesion(telefono);
    setCitaActiva(cita);
    setModalAccesoAbierto(false);
    setModalError(null);
    setCitasDisponibles([]);
    setCitaPendiente(null);
    await cargarSelecciones(telefono, cita);
  }

  async function iniciarSesionDesdeTelefono(telefonoInput, { silencioso = false } = {}) {
    if (!marca?.id) return false;

    if (!silencioso) {
      setModalCargando(true);
      setModalError(null);
    }

    try {
      const datos = await iniciarSesionGaleria(marca.id, telefonoInput);
      const citas = datos.citas ?? [];
      guardarTelefonoLocalMarca(marca.id, datos.telefono);
      setTelefonoSesion(datos.telefono);

      if (citas.length === 1) {
        await activarSesion(datos.telefono, citas[0]);
        return true;
      }

      setCitasDisponibles(citas);
      const preseleccion = elegirCitaInicial(citas, citaParam, servicioParam) ?? citas[0];
      setCitaPendiente(preseleccion);
      setModalAccesoAbierto(true);
      return true;
    } catch (err) {
      if (silencioso) {
        setModalAccesoAbierto(false);
        setModalError(null);
      } else {
        setModalError(err.message);
        setModalAccesoAbierto(true);
      }
      setCitasDisponibles([]);
      setTelefonoSesion('');
      setCitaPendiente(null);
      return false;
    } finally {
      if (!silencioso) {
        setModalCargando(false);
      }
    }
  }

  useEffect(() => {
    sesionRestauradaRef.current = false;
  }, [marca?.id]);

  useEffect(() => {
    if (!marca?.id || sesionRestauradaRef.current) return undefined;

    sesionRestauradaRef.current = true;
    const telefonoLocal = leerTelefonoLocalMarca(marca.id);

    if (!telefonoLocal) {
      setRestaurandoSesion(false);
      setModalAccesoAbierto(true);
      return undefined;
    }

    let cancelado = false;
    setRestaurandoSesion(true);
    setModalAccesoAbierto(false);

    iniciarSesionDesdeTelefono(telefonoLocal, { silencioso: true }).finally(() => {
      if (!cancelado) setRestaurandoSesion(false);
    });

    return () => {
      cancelado = true;
    };
  }, [marca?.id, citaParam, servicioParam]);

  async function manejarTelefonoSubmit(telefonoInput) {
    await iniciarSesionDesdeTelefono(telefonoInput);
  }

  async function manejarConfirmarCitaDesdeLista() {
    if (!citaPendiente) {
      setModalError('Elige una cita para continuar.');
      return;
    }
    if (!telefonoSesion) {
      setModalError('Vuelve a ingresar tu telefono.');
      return;
    }

    setModalCargando(true);
    setModalError(null);

    try {
      await activarSesion(telefonoSesion, citaPendiente);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalCargando(false);
    }
  }

  function cerrarModalAcceso() {
    setModalAccesoAbierto(false);
    if (!citaActiva) {
      setCitasDisponibles([]);
      setCitaPendiente(null);
      setTelefonoSesion('');
      setModalError(null);
    }
  }

  function cerrarSesionGaleria() {
    setCitaActiva(null);
    setTelefonoSesion('');
    setSeleccionados([]);
    setCitasDisponibles([]);
    setCitaPendiente(null);
    setModalError(null);
    setModalAccesoAbierto(false);
  }

  async function cambiarCita() {
    cerrarSesionGaleria();
    const tel = telefonoGuardado ?? telefonoSesion;
    if (tel) {
      await iniciarSesionDesdeTelefono(tel);
      return;
    }
    setModalAccesoAbierto(true);
  }

  function abrirModalAcceso() {
    setModalError(null);
    setModalAccesoAbierto(true);
  }

  async function toggleDiseno(disenoId) {
    if (!sesionActiva || toggleandoId) return;

    const activo = seleccionados.includes(disenoId);
    setToggleandoId(disenoId);
    setError(null);

    try {
      const payload = {
        telefono: telefonoSesion,
        citaId: citaActiva.id,
        disenoId,
      };

      const datos = activo
        ? await quitarSeleccionGaleria(marca.id, payload)
        : await agregarSeleccionGaleria(marca.id, payload);

      setSeleccionados(datos.disenoIds ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setToggleandoId(null);
    }
  }

  if (cargandoMarca || restaurandoSesion) return <Cargando mensaje="Cargando galeria..." />;
  if (errorMarca) return <MensajeError mensaje={errorMarca} />;

  return (
    <div className="galeria-publica">
      <ModalAccesoGaleria
        abierto={modalAccesoAbierto}
        cargando={modalCargando}
        error={modalError}
        citas={citasDisponibles}
        citaSeleccionadaId={citaPendiente?.id ?? null}
        telefonoInicial={telefonoGuardado ?? ''}
        mostrarTelefono={!telefonoGuardado}
        onTelefonoSubmit={manejarTelefonoSubmit}
        onElegirCita={setCitaPendiente}
        onConfirmarCita={manejarConfirmarCitaDesdeLista}
        onCerrar={cerrarModalAcceso}
      />

      <EncabezadoMarca marca={marca} titulo="Galeria de disenos" />

      {sesionActiva && (
        <section className="galeria-publica__sesion tarjeta-app">
          <div>
            <p className="galeria-publica__sesion-etiqueta">Guardando para tu cita</p>
            <strong>{citaActiva.servicio.nombre}</strong>
            <span>
              {formatearFechaLegible(citaActiva.fecha)} · {citaActiva.horaInicio}
            </span>
            <p className="galeria-publica__sesion-ayuda">
              Toca el corazon en los disenos que te gusten. Se asocian a tu reserva.
            </p>
          </div>
          <button type="button" className="galeria-publica__sesion-cambiar" onClick={cambiarCita}>
            Cambiar cita
          </button>
        </section>
      )}

      {!sesionActiva && !modalAccesoAbierto && !restaurandoSesion && (
        <p className="galeria-publica__aviso-sesion">
          {telefonoGuardado ? (
            <>
              <button type="button" onClick={() => iniciarSesionDesdeTelefono(telefonoGuardado)}>
                Vincular tu cita
              </button>
              {' '}para guardar disenos en tu reserva.
            </>
          ) : (
            <>
              <button type="button" onClick={abrirModalAcceso}>
                Ingresa tu telefono
              </button>
              {' '}para guardar disenos en tu cita reservada.
            </>
          )}
        </p>
      )}

      <GaleriaFiltrosAcordeon
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        categoria={categoria}
        onCategoriaChange={setCategoria}
        temporada={temporada}
        onTemporadaChange={setTemporada}
        tendencia={tendencia}
        onTendenciaChange={setTendencia}
        categorias={categorias}
        temporadas={temporadas}
        catalogo={catalogo}
        onLimpiar={() => {
          setBusqueda('');
          setCategoria('todas');
          setTemporada('todas');
          setTendencia('todas');
        }}
      />

      {hayFiltros && !cargando && (
        <p className="galeria-publica__resultados">
          {disenosFiltrados.length} de {disenos.length} disenos
          {sesionActiva && seleccionados.length > 0 && (
            <> · {seleccionados.length} seleccionados</>
          )}
        </p>
      )}

      {error && <MensajeError mensaje={error} suave />}

      {cargando && <Cargando />}

      {!cargando && disenos.length === 0 && (
        <p className="galeria-publica__vacio">Aun no hay disenos en la galeria.</p>
      )}

      {!cargando && disenos.length > 0 && disenosFiltrados.length === 0 && (
        <p className="galeria-publica__vacio">No hay disenos con esos filtros.</p>
      )}

      {!cargando && disenosFiltrados.length > 0 && (
        <div className="galeria-publica__grid">
          {disenosFiltrados.map((diseno) => {
            const seleccionado = seleccionados.includes(diseno.id);
            return (
              <figure key={diseno.id} className="galeria-publica__item">
                <div className="galeria-publica__item-media">
                  <ImagenAmpliable src={diseno.imagenRuta} alt={diseno.titulo} loading="lazy" />
                  {diseno.enTendencia && (
                    <span className="galeria-publica__tendencia">En tendencia</span>
                  )}
                  {sesionActiva && (
                    <button
                      type="button"
                      className={`galeria-publica__like${
                        seleccionado ? ' galeria-publica__like--activo' : ''
                      }`}
                      onClick={() => toggleDiseno(diseno.id)}
                      disabled={toggleandoId === diseno.id}
                      aria-label={
                        seleccionado
                          ? `Quitar ${diseno.titulo} de tu seleccion`
                          : `Guardar ${diseno.titulo} para tu cita`
                      }
                      aria-pressed={seleccionado}
                    >
                      <IconoApp nombre="corazon" tamano="sm" />
                    </button>
                  )}
                </div>
                <figcaption>
                  <strong>{diseno.titulo}</strong>
                  <div className="galeria-publica__meta">
                    {diseno.categoria && (
                      <span className="galeria-publica__etiqueta galeria-publica__etiqueta--cat">
                        {etiquetaDesdeCatalogo(diseno.categoria, catalogo)}
                      </span>
                    )}
                    {diseno.temporada && (
                      <span className="galeria-publica__etiqueta galeria-publica__etiqueta--temp">
                        {etiquetaDesdeCatalogo(diseno.temporada, catalogo)}
                      </span>
                    )}
                  </div>
                  {diseno.coloresRelacionados?.length > 0 && (
                    <div className="galeria-publica__colores">
                      {diseno.coloresRelacionados.map((color) => (
                        <span key={color}>{color}</span>
                      ))}
                    </div>
                  )}
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}
    </div>
  );
}
