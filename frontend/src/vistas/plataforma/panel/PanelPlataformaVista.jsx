import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BotonPrincipal, Cargando, MensajeError } from '../../../compartido/componentes';
import { RUTAS_PLATAFORMA } from '../../../compartido/constantes';
import {
  listarMarcasPlataforma,
  obtenerResumenPlataforma,
} from '../../../modulos/plataforma/servicios/plataformaServicio';
import '../../../estilos/plataforma/panel/panel.css';

export default function PanelPlataformaVista() {
  const [resumen, setResumen] = useState(null);
  const [marcas, setMarcas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const [datosResumen, listaMarcas] = await Promise.all([
        obtenerResumenPlataforma(),
        listarMarcasPlataforma(),
      ]);
      setResumen(datosResumen);
      setMarcas(listaMarcas);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  if (cargando) return <Cargando />;
  if (error) return <MensajeError mensaje={error} onReintentar={cargar} />;

  return (
    <div className="panel-plataforma">
      <header className="panel-plataforma__cabecera">
        <div>
          <h2>Control de la plataforma</h2>
          <p>Gestiona empresas, reportes globales y el estado general del SaaS.</p>
        </div>
        <BotonPrincipal to={RUTAS_PLATAFORMA.marcas}>+ Nueva empresa</BotonPrincipal>
      </header>

      <section className="panel-plataforma__metricas">
        <article className="panel-plataforma__metrica">
          <span>Empresas</span>
          <strong>{resumen.totalMarcas}</strong>
        </article>
        <article className="panel-plataforma__metrica">
          <span>Activas</span>
          <strong>{resumen.marcasActivas}</strong>
        </article>
        <article className="panel-plataforma__metrica">
          <span>Con plan</span>
          <strong>{resumen.marcasConPlan}</strong>
        </article>
        <article className="panel-plataforma__metrica">
          <span>Citas totales</span>
          <strong>{resumen.totalCitas}</strong>
        </article>
        <article className="panel-plataforma__metrica">
          <span>Usuarios marca</span>
          <strong>{resumen.totalUsuariosMarca}</strong>
        </article>
        <article className="panel-plataforma__metrica">
          <span>Con Google Calendar</span>
          <strong>{resumen.marcasConGoogle}</strong>
        </article>
      </section>

      <section className="panel-plataforma__bloques">
        <div className="panel-plataforma__bloque">
          <h3>Acciones rapidas</h3>
          <ul className="panel-plataforma__acciones">
            <li><Link to={RUTAS_PLATAFORMA.marcas}>Crear o administrar empresas</Link></li>
            <li><Link to={RUTAS_PLATAFORMA.reportes}>Ver reportes globales</Link></li>
          </ul>
        </div>

        <div className="panel-plataforma__bloque panel-plataforma__bloque--marcas">
          <div className="panel-plataforma__bloque-cabecera">
            <h3>Todas tus marcas</h3>
            <Link to={RUTAS_PLATAFORMA.marcas}>Ver lista completa →</Link>
          </div>
          {marcas.length === 0 ? (
            <p>No hay marcas. Crea DaniSpa, AlejaNails u otras desde Mis marcas.</p>
          ) : (
            <ul className="panel-plataforma__lista-marcas">
              {marcas.map((marca) => (
                <li key={marca.id}>
                  <div>
                    <strong>{marca.nombreComercial}</strong>
                    <span>/m/{marca.slug}</span>
                    {marca.adminCorreo && <span>{marca.adminCorreo}</span>}
                  </div>
                  <Link to={RUTAS_PLATAFORMA.editarMarca(marca.id)}>Editar</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <p className="panel-plataforma__nota">
        Cada empresa entra con su propio admin y gestiona perfil, colores, agenda, galeria,
        blog y Google Calendar de forma independiente.
      </p>
    </div>
  );
}
