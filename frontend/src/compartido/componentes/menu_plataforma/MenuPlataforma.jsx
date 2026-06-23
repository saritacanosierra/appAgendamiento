import { NavLink } from 'react-router-dom';
import { RUTAS_PLATAFORMA } from '../../constantes';
import IconoApp from '../icono_app/IconoApp';
import '../../../estilos/plataforma/menu_plataforma/menu_plataforma.css';

const enlaces = [
  { to: RUTAS_PLATAFORMA.panel, etiqueta: 'Panel', icono: 'panel' },
  { to: RUTAS_PLATAFORMA.marcas, etiqueta: 'Mis marcas', icono: 'marcas' },
  { to: RUTAS_PLATAFORMA.reportes, etiqueta: 'Reportes', icono: 'reportes' },
];

export default function MenuPlataforma() {
  return (
    <nav className="menu-plataforma" aria-label="Navegación plataforma">
      {enlaces.map((enlace) => (
        <NavLink
          key={enlace.to}
          to={enlace.to}
          className={({ isActive }) =>
            `menu-plataforma__item ${isActive ? 'menu-plataforma__item--activo' : ''}`
          }
        >
          <IconoApp nombre={enlace.icono} className="menu-plataforma__icono" />
          {enlace.etiqueta}
        </NavLink>
      ))}
    </nav>
  );
}
