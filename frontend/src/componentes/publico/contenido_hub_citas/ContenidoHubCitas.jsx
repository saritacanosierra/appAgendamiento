import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Cargando,
  HorariosDisponiblesDia,
  TarjetaServicio,
} from '../../../compartido/componentes';
import { RUTAS_PUBLICAS } from '../../../compartido/constantes';
import { obtenerServiciosPublicos } from '../../../modulos/publico_marca/servicios/marcaServicio';
import { formatearPrecio } from '../../../compartido/utilidades/temaMarca';
import '../../../estilos/publico/citas/citas-hub.css';

function serviciosAgendables(lista) {
  return (Array.isArray(lista) ? lista : []).filter((servicio) => (servicio.tipo ?? 'marca') !== 'adicional');
}

export default function ContenidoHubCitas({ marca }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const horarioRef = useRef(null);
  const [servicios, setServicios] = useState([]);
  const [servicioElegido, setServicioElegido] = useState(null);
  const [cargandoServicios, setCargandoServicios] = useState(false);

  useEffect(() => {
    if (!marca?.id) return undefined;
    let cancelado = false;
    setCargandoServicios(true);
    obtenerServiciosPublicos(marca.id)
      .then((lista) => {
        if (!cancelado) setServicios(serviciosAgendables(lista));
      })
      .catch(() => {
        if (!cancelado) setServicios([]);
      })
      .finally(() => {
        if (!cancelado) setCargandoServicios(false);
      });
    return () => {
      cancelado = true;
    };
  }, [marca?.id]);

  useEffect(() => {
    if (!servicioElegido) return;
    horarioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [servicioElegido]);

  function elegirServicio(servicio) {
    setServicioElegido(servicio);
  }

  function reservarHorario(servicio, fecha, hora) {
    const params = new URLSearchParams({
      servicio: String(servicio.id),
      fecha,
      hora,
    });
    navigate(`${RUTAS_PUBLICAS.reservar(slug)}?${params.toString()}`);
  }

  if (cargandoServicios) return <Cargando mensaje="Cargando servicios..." />;

  if (servicios.length === 0) {
    return <p className="citas-hub__vacio">Pronto habrá servicios para agendar.</p>;
  }

  if (servicioElegido) {
    return (
      <div className="citas-hub__reserva">
        <section className="citas-hub__elegido tarjeta-app">
          <p>Vas a agendar</p>
          <strong>{servicioElegido.nombre}</strong>
          <span>
            {servicioElegido.duracionMinutos} min · {formatearPrecio(servicioElegido.precio)}
          </span>
          <button type="button" onClick={() => setServicioElegido(null)}>
            Cambiar servicio
          </button>
        </section>

        <section ref={horarioRef} className="citas-hub__disponibilidad tarjeta-app">
          <HorariosDisponiblesDia
            marcaId={marca.id}
            servicios={[servicioElegido]}
            ocultarServicio
            onElegirHorario={reservarHorario}
          />
        </section>
      </div>
    );
  }

  return (
    <section className="citas-hub__servicios">
      <h2>Elige un servicio</h2>
      <div className="citas-hub__lista-servicios">
        {servicios.map((servicio) => (
          <TarjetaServicio
            key={servicio.id}
            servicio={servicio}
            textoAccion="Agendar"
            accionAncha
            onSeleccionar={elegirServicio}
          />
        ))}
      </div>
    </section>
  );
}
