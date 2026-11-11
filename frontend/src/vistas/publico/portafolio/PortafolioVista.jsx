import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMarca } from '../../../aplicacion/proveedores/ProveedorMarca';
import PortafolioEquipo from '../../../componentes/publico/portafolio_equipo/PortafolioEquipo';
import { Cargando, EncabezadoMarca, MensajeError } from '../../../compartido/componentes';
import { listarPortafolioPublico } from '../../../modulos/reservas/servicios/estilistasServicio';
import '../../../estilos/publico/portafolio/portafolio.css';

export default function PortafolioVista() {
  const { slug } = useParams();
  const { marca, cargando: cargandoMarca, error: errorMarca } = useMarca();
  const [profesionales, setProfesionales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!marca?.id) return undefined;
    let cancelado = false;
    setCargando(true);
    listarPortafolioPublico(marca.id)
      .then((lista) => {
        if (!cancelado) setProfesionales(lista);
      })
      .catch((err) => {
        if (!cancelado) setError(err.message);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [marca?.id]);

  if (cargandoMarca) return <Cargando />;
  if (errorMarca) return <MensajeError titulo="Marca no disponible" mensaje={errorMarca} />;
  if (!marca) return null;

  return (
    <div className="portafolio-vista">
      <EncabezadoMarca marca={marca} compacto titulo={profesionales.length > 1 ? 'Equipo' : 'Portafolio'} />
      {error && <MensajeError mensaje={error} />}
      {cargando && <Cargando />}
      {!cargando && profesionales.length === 0 && (
        <p className="portafolio-vista__vacio">Todavía no hay un portafolio publicado.</p>
      )}
      <PortafolioEquipo profesionales={profesionales} slug={slug} />
    </div>
  );
}
