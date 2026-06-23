import { NavLink } from 'react-router-dom';
import { RUTAS_PLATAFORMA } from '../../constantes';
import '../../../estilos/plataforma/menu_plataforma/menu_plataforma.css';

const enlaces = [
  { to: RUTAS_PLATAFORMA.panel, etiqueta: 'Panel' },
  { to: RUTAS_PLATAFORMA.marcas, etiqueta: 'Mis marcas' },
  { to: RUTAS_PLATAFORMA.reportes, etiqueta: 'Reportes' },
];

export default function MenuPlataforma() {
  return (
    <nav className="menu-plataforma" aria-label="Navegacion plataforma">
      {enlaces.map((enlace) => (
        <NavLink
          key={enlace.to}
          to={enlace.to}
          className={({ isActive }) =>
            `menu-plataforma__item ${isActive ? 'menu-plataforma__item--activo' : ''}`
          }
        >
          {enlace.etiqueta}
        </NavLink>
      ))}
    </nav>
  );
}
