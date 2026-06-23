import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerEstadoApi } from '../../../compartido/utilidades/apiCliente';
import { BotonPrincipal, Cargando, MensajeError } from '../../../compartido/componentes';
import { RUTAS_ADMIN, RUTAS_PLATAFORMA, RUTAS_PUBLICAS } from '../../../compartido/constantes';
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
        <h1>Spa Unas</h1>
        <p>Plataforma SaaS multi-marca. Cada empresa opera como su propia app con reservas, galeria y blog.</p>
      </header>

      {cargando && <Cargando mensaje="Verificando conexion con la API..." />}
      {error && <MensajeError mensaje={error} onReintentar={() => window.location.reload()} />}

      <section className="inicio-plataforma__accesos">
        <article className="inicio-plataforma__tarjeta inicio-plataforma__tarjeta--plataforma">
          <span className="inicio-plataforma__etiqueta inicio-plataforma__etiqueta--plataforma">
            Control total
          </span>
          <h2>Administrador de plataforma</h2>
          <p className="inicio-plataforma__url">{RUTAS_PLATAFORMA.login}</p>
          <p>
            Crea DaniSpa, AlejaNails y todas las marcas. Activa planes y supervisa el SaaS.
          </p>
          <ul className="inicio-plataforma__lista">
            <li>+ Agregar marcas</li>
            <li>Gestionar empresas</li>
            <li>Reportes globales</li>
          </ul>
          <BotonPrincipal to={RUTAS_PLATAFORMA.login} anchoCompleto>
            Entrar como superadmin
          </BotonPrincipal>
          <span className="inicio-plataforma__hint">Demo: platform@spa-unas.test</span>
        </article>

        <article className="inicio-plataforma__tarjeta inicio-plataforma__tarjeta--marca">
          <span className="inicio-plataforma__etiqueta inicio-plataforma__etiqueta--marca">
            Una empresa
          </span>
          <h2>Admin de una marca</h2>
          <p className="inicio-plataforma__url">{RUTAS_ADMIN.login}</p>
          <p>
            Solo tu spa: perfil, colores, agenda, galeria, blog y Google Calendar propios.
          </p>
          <ul className="inicio-plataforma__lista">
            <li>Mi marca y colores</li>
            <li>Agenda y clientes</li>
            <li>Galeria y blog</li>
          </ul>
          <BotonPrincipal to={RUTAS_ADMIN.login} variante="secundario" anchoCompleto>
            Entrar al panel de mi marca
          </BotonPrincipal>
          <span className="inicio-plataforma__hint">Demo: admin@lunanails.test</span>
        </article>
      </section>

      <section className="inicio-plataforma__demo">
        <h3>Demo publica</h3>
        <Link to={RUTAS_PUBLICAS.inicioMarca('luna-nails')}>Ver sitio de Luna Nails →</Link>
      </section>

      {estadoApi?.exito && (
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
