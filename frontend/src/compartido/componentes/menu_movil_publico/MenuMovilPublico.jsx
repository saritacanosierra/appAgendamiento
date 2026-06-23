import { NavLink, useParams } from 'react-router-dom';
import { RUTAS_PUBLICAS } from '../../constantes';
import '../../../estilos/compartido/menu_movil_publico/menu_movil_publico.css';

export default function MenuMovilPublico() {
  const { slug } = useParams();

  if (!slug) return null;

  const enlaces = [
    { to: RUTAS_PUBLICAS.inicioMarca(slug), etiqueta: 'Inicio', icono: '🏠' },
    { to: RUTAS_PUBLICAS.reservar(slug), etiqueta: 'Reservar', icono: '📅' },
    { to: RUTAS_PUBLICAS.galeria(slug), etiqueta: 'Galeria', icono: '💅' },
    { to: RUTAS_PUBLICAS.blog(slug), etiqueta: 'Blog', icono: '📖' },
  ];

  return (
    <nav className="menu-movil-publico" aria-label="Navegacion principal">
      {enlaces.map((enlace) => (
        <NavLink
          key={enlace.to}
          to={enlace.to}
          className={({ isActive }) =>
            `menu-movil-publico__item ${isActive ? 'menu-movil-publico__item--activo' : ''}`
          }
          end={enlace.etiqueta === 'Inicio'}
        >
          <span aria-hidden="true">{enlace.icono}</span>
          <span>{enlace.etiqueta}</span>
        </NavLink>
      ))}
    </nav>
  );
}
