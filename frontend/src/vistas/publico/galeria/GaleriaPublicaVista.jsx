import { useEffect, useMemo, useState } from 'react';
import { useMarca } from '../../../aplicacion/proveedores/ProveedorMarca';
import { Cargando, EncabezadoMarca, GaleriaFiltrosAcordeon, ImagenAmpliable, MensajeError } from '../../../compartido/componentes';
import {
  listarCatalogoGaleriaPublica,
  listarGaleriaPublica,
} from '../../../modulos/galeria/servicios/galeriaServicio';
import {
  categoriasUnicas,
  etiquetaDesdeCatalogo,
  filtrarDisenosGaleria,
  temporadasUnicas,
} from '../../../modulos/galeria/utilidades/filtrarDisenosGaleria';
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

  if (cargandoMarca) return <Cargando />;
  if (errorMarca) return <MensajeError mensaje={errorMarca} />;

  return (
    <div className="galeria-publica">
      <EncabezadoMarca marca={marca} titulo="Galeria de disenos" />

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
        </p>
      )}

      {error && <MensajeError mensaje={error} />}

      {cargando && <Cargando />}

      {!cargando && disenos.length === 0 && (
        <p className="galeria-publica__vacio">Aun no hay disenos en la galeria.</p>
      )}

      {!cargando && disenos.length > 0 && disenosFiltrados.length === 0 && (
        <p className="galeria-publica__vacio">No hay disenos con esos filtros.</p>
      )}

      {!cargando && disenosFiltrados.length > 0 && (
        <div className="galeria-publica__grid">
          {disenosFiltrados.map((diseno) => (
            <figure key={diseno.id} className="galeria-publica__item">
              <div className="galeria-publica__item-media">
                <ImagenAmpliable src={diseno.imagenRuta} alt={diseno.titulo} loading="lazy" />
                {diseno.enTendencia && (
                  <span className="galeria-publica__tendencia">En tendencia</span>
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
          ))}
        </div>
      )}
    </div>
  );
}
