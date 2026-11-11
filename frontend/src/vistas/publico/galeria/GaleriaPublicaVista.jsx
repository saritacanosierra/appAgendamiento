import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  guardarTelefonoLocalMarca,
  leerTelefonoLocalMarca,
} from '../../../modulos/reservas/utilidades/credencialesMiCita';
import '../../../estilos/publico/galeria/galeria.css';

export default function GaleriaPublicaVista() {
  const { marca, cargando: cargandoMarca, error: errorMarca } = useMarca();
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
  const [telefonoSesion, setTelefonoSesion] = useState('');
  const [seleccionados, setSeleccionados] = useState([]);
  const [toggleandoId, setToggleandoId] = useState(null);
  const sesionRestauradaRef = useRef(false);

  const sesionActiva = Boolean(telefonoSesion);
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

  const cargarSelecciones = useCallback(async (telefono) => {
    const datos = await listarSeleccionesGaleria(marca.id, { telefono });
    setSeleccionados(datos.disenoIds ?? []);
  }, [marca?.id]);

  async function iniciarSesionDesdeTelefono(telefonoInput, { silencioso = false } = {}) {
    if (!marca?.id) return false;

    if (!silencioso) {
      setModalCargando(true);
      setModalError(null);
    }

    try {
      const datos = await iniciarSesionGaleria(marca.id, telefonoInput);
      guardarTelefonoLocalMarca(marca.id, datos.telefono);
      setTelefonoSesion(datos.telefono);
      setModalAccesoAbierto(false);
      setModalError(null);
      await cargarSelecciones(datos.telefono);
      return true;
    } catch (err) {
      if (silencioso) {
        setModalAccesoAbierto(false);
        setModalError(null);
      } else {
        setModalError(err.message);
        setModalAccesoAbierto(true);
      }
      setTelefonoSesion('');
      setSeleccionados([]);
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
  }, [marca?.id]);

  async function manejarTelefonoSubmit(telefonoInput) {
    await iniciarSesionDesdeTelefono(telefonoInput);
  }

  function cerrarModalAcceso() {
    setModalAccesoAbierto(false);
    if (!telefonoSesion) {
      setModalError(null);
    }
  }

  function cambiarCelular() {
    setTelefonoSesion('');
    setSeleccionados([]);
    setModalError(null);
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
        telefonoInicial={telefonoSesion || telefonoGuardado || ''}
        onTelefonoSubmit={manejarTelefonoSubmit}
        onCerrar={cerrarModalAcceso}
      />

      <EncabezadoMarca marca={marca} compacto titulo="Galería" />

      {sesionActiva && (
        <section className="galeria-publica__sesion tarjeta-app">
          <div>
            <p className="galeria-publica__sesion-etiqueta">Guardando en tu celular</p>
            <strong>{telefonoSesion}</strong>
            <p className="galeria-publica__sesion-ayuda">
              Toca el corazon en las fotos que te gusten. Cuando agendes, quedan en tu cita.
            </p>
          </div>
          <button type="button" className="galeria-publica__sesion-cambiar" onClick={cambiarCelular}>
            Cambiar celular
          </button>
        </section>
      )}

      {!sesionActiva && !modalAccesoAbierto && !restaurandoSesion && (
        <p className="galeria-publica__aviso-sesion">
          <button type="button" onClick={abrirModalAcceso}>
            Ingresa tu celular
          </button>
          {' '}para guardar las fotos que te gusten. No necesitas tener una cita.
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
                          : `Guardar ${diseno.titulo} en tu celular`
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
