import { useEffect, useMemo, useState } from 'react';
import { useMarca } from '../../../aplicacion/proveedores/ProveedorMarca';
import { Cargando, EncabezadoMarca, GaleriaFiltrosAcordeon, ImagenAmpliable, MensajeError } from '../../../compartido/componentes';
import { listarGaleriaPublica } from '../../../modulos/galeria/servicios/galeriaServicio';
import {
  categoriasUnicas,
  filtrarDisenosGaleria,
} from '../../../modulos/galeria/utilidades/filtrarDisenosGaleria';
import '../../../estilos/publico/galeria/galeria.css';

export default function GaleriaPublicaVista() {
  const { marca, cargando: cargandoMarca, error: errorMarca } = useMarca();
  const [disenos, setDisenos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [tendencia, setTendencia] = useState('todas');

  useEffect(() => {
    if (!marca?.id) return;

    setCargando(true);
    listarGaleriaPublica(marca.id)
      .then(setDisenos)
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [marca?.id]);

  const categorias = useMemo(() => categoriasUnicas(disenos), [disenos]);

  const disenosFiltrados = useMemo(
    () => filtrarDisenosGaleria(disenos, { busqueda, categoria, tendencia }),
    [disenos, busqueda, categoria, tendencia]
  );

  const hayFiltros = Boolean(busqueda.trim()) || categoria !== 'todas' || tendencia !== 'todas';

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
        tendencia={tendencia}
        onTendenciaChange={setTendencia}
        categorias={categorias}
        onLimpiar={() => {
          setBusqueda('');
          setCategoria('todas');
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
                {diseno.categoria && <span>{diseno.categoria}</span>}
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
