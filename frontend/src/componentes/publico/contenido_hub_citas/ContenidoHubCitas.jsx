import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BotonPrincipal,
  Cargando,
  HorariosDisponiblesDia,
  TarjetaServicio,
} from '../../../compartido/componentes';
import { RUTAS_PUBLICAS } from '../../../compartido/constantes';
import { obtenerServiciosPublicos } from '../../../modulos/publico_marca/servicios/marcaServicio';
import '../../../estilos/publico/citas/citas-hub.css';

export default function ContenidoHubCitas({ marca, tituloSeccion = 'Servicios' }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [servicios, setServicios] = useState([]);
  const [cargandoServicios, setCargandoServicios] = useState(false);

  useEffect(() => {
    if (!marca?.id) return;

    setCargandoServicios(true);
    obtenerServiciosPublicos(marca.id)
      .then(setServicios)
      .catch(() => setServicios([]))
      .finally(() => setCargandoServicios(false));
  }, [marca?.id]);

  function reservarHorario(servicio, fecha, hora) {
    const params = new URLSearchParams({
      servicio: String(servicio.id),
      fecha,
      hora,
    });
    navigate(`${RUTAS_PUBLICAS.reservar(slug)}?${params.toString()}`);
  }

  return (
    <>
      {!cargandoServicios && servicios.length > 0 && (
        <section className="citas-hub__disponibilidad tarjeta-app">
          <HorariosDisponiblesDia
            marcaId={marca.id}
            servicios={servicios}
            onElegirHorario={reservarHorario}
          />
        </section>
      )}

      <section className="citas-hub__cta tarjeta-app">
        <BotonPrincipal href={RUTAS_PUBLICAS.reservar(slug)} anchoCompleto>
          + Agendar nueva cita
        </BotonPrincipal>
        <div className="citas-hub__secundarias">
          <Link to={RUTAS_PUBLICAS.galeria(slug)}>Ver galería</Link>
          <Link to={RUTAS_PUBLICAS.blog(slug)}>Leer blog</Link>
        </div>
      </section>

      <section className="citas-hub__servicios">
        <h2>{tituloSeccion}</h2>
        {cargandoServicios && <Cargando mensaje="Cargando servicios..." />}
        {!cargandoServicios && servicios.length === 0 && (
          <p className="citas-hub__vacio">Pronto habrá servicios disponibles.</p>
        )}
        <div className="citas-hub__lista-servicios">
          {servicios.map((servicio) => (
            <TarjetaServicio
              key={servicio.id}
              servicio={servicio}
              onSeleccionar={() =>
                navigate(`${RUTAS_PUBLICAS.reservar(slug)}?servicio=${servicio.id}`)
              }
            />
          ))}
        </div>
      </section>
    </>
  );
}
