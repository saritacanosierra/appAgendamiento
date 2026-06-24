import { useMarca } from '../../../aplicacion/proveedores/ProveedorMarca';
import {
  BotonPrincipal,
  CarruselMarca,
  Cargando,
  EncabezadoMarca,
  MensajeError,
} from '../../../compartido/componentes';
import { RUTAS_PUBLICAS } from '../../../compartido/constantes';
import { Link, useParams } from 'react-router-dom';
import '../../../estilos/publico/home/home.css';

export default function InicioMarcaVista() {
  const { slug } = useParams();
  const { marca, cargando, error } = useMarca();

  if (cargando) return <Cargando />;
  if (error) return <MensajeError titulo="Marca no disponible" mensaje={error} />;
  if (!marca) return null;

  return (
    <div className="inicio-marca">
      <EncabezadoMarca marca={marca} />

      <CarruselMarca marca={marca} slug={slug} />

      <div className="inicio-marca__saludo">
        <p className="inicio-marca__bienvenida">Bienvenida</p>
        <h2 className="inicio-marca__titulo">Tu momento de cuidado personal</h2>
      </div>

      <section className="inicio-marca__agendar tarjeta-app">
        <p className="inicio-marca__agendar-texto">
          Reserva en segundos y elige el horario que más te convenga.
        </p>
        <BotonPrincipal href={RUTAS_PUBLICAS.reservar(slug)} anchoCompleto>
          Agendar cita
        </BotonPrincipal>
        <Link to={RUTAS_PUBLICAS.citas(slug)} className="inicio-marca__ver-citas">
          Ver horarios y servicios →
        </Link>
      </section>
    </div>
  );
}
