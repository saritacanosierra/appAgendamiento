import { NavLink } from 'react-router-dom';
import { RUTAS_ADMIN } from '../../constantes';
import '../../../estilos/compartido/menu_admin/menu_admin.css';

const enlaces = [
  { to: RUTAS_ADMIN.panel, etiqueta: 'Inicio' },
  { to: RUTAS_ADMIN.configuracionMarca, etiqueta: 'Mi marca' },
  { to: RUTAS_ADMIN.agenda, etiqueta: 'Agenda' },
  { to: RUTAS_ADMIN.reportes, etiqueta: 'Reportes' },
  { to: RUTAS_ADMIN.clientes, etiqueta: 'Clientes' },
  { to: RUTAS_ADMIN.servicios, etiqueta: 'Servicios' },
  { to: RUTAS_ADMIN.galeria, etiqueta: 'Galeria' },
  { to: RUTAS_ADMIN.blog, etiqueta: 'Blog' },
];

export default function MenuAdmin() {
  return (
    <nav className="menu-admin" aria-label="Navegacion administrativa">
      {enlaces.map((enlace) => (
        <NavLink
          key={enlace.to}
          to={enlace.to}
          className={({ isActive }) =>
            `menu-admin__item ${isActive ? 'menu-admin__item--activo' : ''}`
          }
        >
          {enlace.etiqueta}
        </NavLink>
      ))}
    </nav>
  );
}
