import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMarca } from '../../../aplicacion/proveedores/ProveedorMarca';
import {
  BotonPrincipal,
  Cargando,
  EncabezadoMarca,
  MensajeError,
  TarjetaServicio,
} from '../../../compartido/componentes';
import { RUTAS_PUBLICAS } from '../../../compartido/constantes';
import { obtenerServiciosPublicos } from '../../../modulos/publico_marca/servicios/marcaServicio';
import '../../../estilos/publico/home/home.css';

export default function InicioMarcaVista() {
  const { slug } = useParams();
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

  if (cargando) return <Cargando />;
  if (error) return <MensajeError titulo="Marca no disponible" mensaje={error} />;
  if (!marca) return null;

  return (
    <div className="inicio-marca">
      <EncabezadoMarca marca={marca} />

      {marca.direccion && (
        <p className="inicio-marca__contacto">{marca.direccion}</p>
      )}

      <section className="inicio-marca__acciones">
        <BotonPrincipal href={RUTAS_PUBLICAS.reservar(slug)} anchoCompleto>
          Reservar cita
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
