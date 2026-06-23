import { useEffect, useState } from 'react';
import { useMarca } from '../../../aplicacion/proveedores/ProveedorMarca';
import { Cargando, EncabezadoMarca, MensajeError } from '../../../compartido/componentes';
import { listarGaleriaPublica } from '../../../modulos/galeria/servicios/galeriaServicio';
import '../../../estilos/publico/galeria/galeria.css';

export default function GaleriaPublicaVista() {
  const { marca, cargando: cargandoMarca, error: errorMarca } = useMarca();
  const [disenos, setDisenos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!marca?.id) return;

    setCargando(true);
    listarGaleriaPublica(marca.id)
      .then(setDisenos)
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [marca?.id]);

  if (cargandoMarca) return <Cargando />;
  if (errorMarca) return <MensajeError mensaje={errorMarca} />;

  return (
    <div className="galeria-publica">
      <EncabezadoMarca marca={marca} titulo="Galeria de disenos" />

      {error && <MensajeError mensaje={error} />}
      {cargando && <Cargando />}

      {!cargando && disenos.length === 0 && (
        <p className="galeria-publica__vacio">Aun no hay disenos en la galeria.</p>
      )}

      <div className="galeria-publica__grid">
        {disenos.map((diseno) => (
          <figure key={diseno.id} className="galeria-publica__item">
            <img src={diseno.imagenRuta} alt={diseno.titulo} loading="lazy" />
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
    </div>
  );
}
