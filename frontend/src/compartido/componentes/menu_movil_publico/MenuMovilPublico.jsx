import { NavLink, useLocation, useParams } from 'react-router-dom';
import { RUTAS_PUBLICAS } from '../../constantes';
import IconoApp from '../icono_app/IconoApp';
import '../../../estilos/compartido/menu_movil_publico/menu_movil_publico.css';

function rutaActiva(pathname, slug, enlace) {
  if (enlace.icono === 'inicio') {
    const base = RUTAS_PUBLICAS.inicioMarca(slug);
    return pathname === base || pathname === `${base}/`;
  }
  if (enlace.icono === 'citas') {
    return (
      pathname.startsWith(RUTAS_PUBLICAS.citas(slug)) ||
      pathname.startsWith(RUTAS_PUBLICAS.reservar(slug))
    );
  }
  return pathname.startsWith(enlace.to);
}

export default function MenuMovilPublico() {
  const { slug } = useParams();
  const { pathname } = useLocation();

  if (!slug) return null;

  const enlaces = [
    { to: RUTAS_PUBLICAS.inicioMarca(slug), etiqueta: 'Inicio', icono: 'inicio' },
    { to: RUTAS_PUBLICAS.citas(slug), etiqueta: 'Citas', icono: 'citas' },
    { to: RUTAS_PUBLICAS.miCita(slug), etiqueta: 'Mi cita', icono: 'buscar' },
    { to: RUTAS_PUBLICAS.galeria(slug), etiqueta: 'Galería', icono: 'galeria' },
    { to: RUTAS_PUBLICAS.blog(slug), etiqueta: 'Blog', icono: 'blog' },
  ];

  return (
    <nav className="menu-movil-publico" aria-label="Navegación principal">
      {enlaces.map((enlace) => (
        <NavLink
          key={enlace.to}
          to={enlace.to}
          className={() =>
            `menu-movil-publico__item ${rutaActiva(pathname, slug, enlace) ? 'menu-movil-publico__item--activo' : ''}`
          }
          end={enlace.icono === 'inicio'}
        >
          <IconoApp nombre={enlace.icono} className="menu-movil-publico__icono" tamano="md" />
          <span>{enlace.etiqueta}</span>
        </NavLink>
      ))}
    </nav>
  );
}
