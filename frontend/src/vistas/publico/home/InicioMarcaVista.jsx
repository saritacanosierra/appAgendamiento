import { useEffect, useState } from 'react';
import { useMarca } from '../../../aplicacion/proveedores/ProveedorMarca';
import PortafolioEquipo from '../../../componentes/publico/portafolio_equipo/PortafolioEquipo';
import {
  BotonPrincipal,
  CarruselMarca,
  Cargando,
  EncabezadoMarca,
  MensajeError,
} from '../../../compartido/componentes';
import { RUTAS_PUBLICAS } from '../../../compartido/constantes';
import { listarPortafolioPublico } from '../../../modulos/reservas/servicios/estilistasServicio';
import { useParams } from 'react-router-dom';
import '../../../estilos/publico/home/home.css';

export default function InicioMarcaVista() {
  const { slug } = useParams();
  const { marca, cargando, error } = useMarca();
  const [equipo, setEquipo] = useState([]);

  useEffect(() => {
    if (!marca?.id) return undefined;
    let cancelado = false;
    listarPortafolioPublico(marca.id)
      .then((lista) => {
        if (!cancelado) setEquipo(lista);
      })
      .catch(() => {
        if (!cancelado) setEquipo([]);
      });
    return () => {
      cancelado = true;
    };
  }, [marca?.id]);

  if (cargando) return <Cargando />;
  if (error) return <MensajeError titulo="Marca no disponible" mensaje={error} />;
  if (!marca) return null;

  return (
    <div className="inicio-marca">
      <EncabezadoMarca marca={marca} compacto />

      <section className="inicio-marca__agendar tarjeta-app">
        <BotonPrincipal href={RUTAS_PUBLICAS.citas(slug)} anchoCompleto>
          Agendar cita
        </BotonPrincipal>
      </section>

      <CarruselMarca marca={marca} slug={slug} />

      <PortafolioEquipo profesionales={equipo} slug={slug} compacto />
    </div>
  );
}
