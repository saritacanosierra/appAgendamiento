import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMarca } from '../../../aplicacion/proveedores/ProveedorMarca';
import {
  BotonPrincipal,
  Cargando,
  EncabezadoMarca,
  HorariosDisponiblesDia,
  MensajeError,
  TarjetaServicio,
} from '../../../compartido/componentes';
import { RUTAS_PUBLICAS } from '../../../compartido/constantes';
import { obtenerServiciosPublicos } from '../../../modulos/publico_marca/servicios/marcaServicio';
import '../../../estilos/publico/home/home.css';

export default function InicioMarcaVista() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { marca, cargando, error } = useMarca();
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

  if (cargando) return <Cargando />;
  if (error) return <MensajeError titulo="Marca no disponible" mensaje={error} />;
  if (!marca) return null;

  return (
    <div className="inicio-marca">
      <EncabezadoMarca marca={marca} />

      <div className="inicio-marca__saludo">
        <p className="inicio-marca__bienvenida">Bienvenida</p>
        <h2 className="inicio-marca__titulo">¿Lista para tu proxima cita?</h2>
      </div>

      {marca.direccion && (
        <p className="inicio-marca__contacto">{marca.direccion}</p>
      )}

      {!cargandoServicios && servicios.length > 0 && (
        <section className="inicio-marca__disponibilidad tarjeta-app">
          <HorariosDisponiblesDia
            marcaId={marca.id}
            servicios={servicios}
            onElegirHorario={reservarHorario}
          />
        </section>
      )}

      <section className="inicio-marca__cta tarjeta-app">
        <BotonPrincipal href={RUTAS_PUBLICAS.reservar(slug)} anchoCompleto>
          + Agendar nueva cita
        </BotonPrincipal>
        <div className="inicio-marca__secundarias">
          <Link to={RUTAS_PUBLICAS.galeria(slug)}>Ver galeria</Link>
          <Link to={RUTAS_PUBLICAS.blog(slug)}>Leer blog</Link>
        </div>
      </section>

      <section className="inicio-marca__servicios">
        <h2>Servicios</h2>
        {cargandoServicios && <Cargando mensaje="Cargando servicios..." />}
        {!cargandoServicios && servicios.length === 0 && (
          <p className="inicio-marca__vacio">Pronto habra servicios disponibles.</p>
        )}
        <div className="inicio-marca__lista-servicios">
          {servicios.map((servicio) => (
            <TarjetaServicio key={servicio.id} servicio={servicio} />
          ))}
        </div>
      </section>
    </div>
  );
}
