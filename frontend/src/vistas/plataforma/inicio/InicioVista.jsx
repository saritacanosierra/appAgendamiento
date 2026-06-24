import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerEstadoApi } from '../../../compartido/utilidades/apiCliente';
import { BotonPrincipal, Cargando, MensajeError } from '../../../compartido/componentes';
import { RUTAS_ADMIN, RUTAS_PLATAFORMA, RUTAS_PUBLICAS } from '../../../compartido/constantes';
import { PLATAFORMA_HABILITADA } from '../../../compartido/configuracion/entornoApp';
import '../../../estilos/plataforma/inicio/inicio.css';

export default function InicioVista() {
  const [estadoApi, setEstadoApi] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    obtenerEstadoApi()
      .then(setEstadoApi)
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="inicio-plataforma contenedor-app">
      <header className="inicio-plataforma__hero">
        <h1>Agendar Citas</h1>
        <p>Reserva en línea, gestión de agenda y presencia digital para tu negocio.</p>
      </header>

      {cargando && <Cargando mensaje="Verificando conexion con la API..." />}
      {error && <MensajeError mensaje={error} onReintentar={() => window.location.reload()} />}

      <section className="inicio-plataforma__accesos">
        <article className="inicio-plataforma__tarjeta inicio-plataforma__tarjeta--marca">
          <span className="inicio-plataforma__etiqueta inicio-plataforma__etiqueta--marca">
            Administradores
          </span>
          <h2>Panel de tu negocio</h2>
          <p className="inicio-plataforma__url">{RUTAS_ADMIN.login}</p>
          <p>
            Accede solo si tienes cuenta de administrador: agenda, clientes, servicios y configuración de tu marca.
          </p>
          <ul className="inicio-plataforma__lista">
            <li>Agenda y atención</li>
            <li>Clientes y servicios</li>
            <li>Galería y blog</li>
          </ul>
          <BotonPrincipal to={RUTAS_ADMIN.login} anchoCompleto>
            Entrar al panel
          </BotonPrincipal>
        </article>

        {PLATAFORMA_HABILITADA && (
          <article className="inicio-plataforma__tarjeta inicio-plataforma__tarjeta--plataforma">
            <span className="inicio-plataforma__etiqueta inicio-plataforma__etiqueta--plataforma">
              Uso interno
            </span>
            <h2>Operaciones del sistema</h2>
            <p className="inicio-plataforma__url">{RUTAS_PLATAFORMA.login}</p>
            <p>Solo personal autorizado del operador SaaS.</p>
            <BotonPrincipal to={RUTAS_PLATAFORMA.login} variante="secundario" anchoCompleto>
              Acceso interno
            </BotonPrincipal>
          </article>
        )}
      </section>

      <section className="inicio-plataforma__demo">
        <h3>Demo pública</h3>
        <Link to={RUTAS_PUBLICAS.inicioMarca('luna-nails')}>Ver sitio de Luna Nails →</Link>
      </section>

      {estadoApi?.exito && import.meta.env.DEV && (
        <section className="inicio-plataforma__estado">
          <h2>Estado del sistema</h2>
          <ul>
            <li>API: {estadoApi.datos.aplicacion} v{estadoApi.datos.version}</li>
            <li>Entorno: {estadoApi.datos.entorno}</li>
            <li>Base de datos: {estadoApi.datos.base_datos.conectada ? 'Conectada' : 'No conectada'}</li>
          </ul>
        </section>
      )}
    </div>
  );
}
