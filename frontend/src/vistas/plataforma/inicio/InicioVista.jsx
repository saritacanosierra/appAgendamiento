import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerEstadoApi } from '../../../compartido/utilidades/apiCliente';
import { BotonPrincipal, Cargando, MensajeError } from '../../../compartido/componentes';
import { RUTAS_ADMIN, RUTAS_PUBLICAS } from '../../../compartido/constantes';
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
        <p>Plataforma SaaS multi-marca para reservas, galeria y blog de spas de unas.</p>
      </header>

      {cargando && <Cargando mensaje="Verificando conexion con la API..." />}
      {error && <MensajeError mensaje={error} onReintentar={() => window.location.reload()} />}

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

      <section className="inicio-plataforma__enlaces">
        <BotonPrincipal href={RUTAS_PUBLICAS.inicioMarca('luna-nails')} anchoCompleto>
          Ver demo publica — Luna Nails
        </BotonPrincipal>
        <Link to={RUTAS_ADMIN.login} className="inicio-plataforma__link-admin">
          Ir al panel administrativo
        </Link>
      </section>

      <span className="badge-fase">Fase 1 — Estructura base</span>
    </div>
  );
}
