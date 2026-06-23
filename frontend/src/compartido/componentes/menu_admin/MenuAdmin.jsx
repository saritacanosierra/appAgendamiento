import { NavLink } from 'react-router-dom';
import { RUTAS_ADMIN } from '../../constantes';
import IconoApp from '../icono_app/IconoApp';
import '../../../estilos/compartido/menu_admin/menu_admin.css';

export const GRUPOS_MENU_ADMIN = [
  {
    id: 'inicio',
    titulo: null,
    items: [{ to: RUTAS_ADMIN.panel, etiqueta: 'Inicio', icono: 'inicio' }],
  },
  {
    id: 'operacion',
    titulo: 'Operación',
    items: [
      { to: RUTAS_ADMIN.agenda, etiqueta: 'Agenda', icono: 'agenda' },
      { to: RUTAS_ADMIN.atencion, etiqueta: 'Atención', icono: 'atencion' },
      { to: RUTAS_ADMIN.clientes, etiqueta: 'Clientes', icono: 'clientes' },
      { to: RUTAS_ADMIN.servicios, etiqueta: 'Servicios', icono: 'servicios' },
      { to: RUTAS_ADMIN.reportes, etiqueta: 'Reportes', icono: 'reportes' },
    ],
  },
  {
    id: 'contenido',
    titulo: 'Contenido',
    items: [
      { to: RUTAS_ADMIN.carruselInicio, etiqueta: 'Carrusel', icono: 'carrusel' },
      { to: RUTAS_ADMIN.galeria, etiqueta: 'Galería', icono: 'galeria' },
      { to: RUTAS_ADMIN.blog, etiqueta: 'Blog', icono: 'blog' },
    ],
  },
  {
    id: 'config',
    titulo: 'Configuración',
    items: [{ to: RUTAS_ADMIN.configuracionMarca, etiqueta: 'Mi marca', icono: 'config' }],
  },
];

export const NAV_MOVIL_ADMIN = [
  { to: RUTAS_ADMIN.panel, etiqueta: 'Inicio', icono: 'inicio' },
  { to: RUTAS_ADMIN.agenda, etiqueta: 'Agenda', icono: 'agenda' },
  { to: RUTAS_ADMIN.atencion, etiqueta: 'Atención', icono: 'atencion' },
  { to: RUTAS_ADMIN.clientes, etiqueta: 'Clientes', icono: 'clientes' },
];

function enlaceClase(isActive) {
  return `menu-admin__item ${isActive ? 'menu-admin__item--activo' : ''}`;
}

export function MenuAdminSidebar() {
  return (
    <nav className="menu-admin menu-admin--sidebar" aria-label="Navegación administrativa">
      {GRUPOS_MENU_ADMIN.map((grupo) => (
        <div key={grupo.id} className="menu-admin__grupo">
          {grupo.titulo && <p className="menu-admin__grupo-titulo">{grupo.titulo}</p>}
          <ul className="menu-admin__lista">
            {grupo.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === RUTAS_ADMIN.panel}
                  className={({ isActive }) => enlaceClase(isActive)}
                >
                  <IconoApp nombre={item.icono} className="menu-admin__icono" />
                  {item.etiqueta}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function MenuAdminMovil({ menuAbierto, onAlternarMenu, onCerrarMenu }) {
  return (
    <>
      <nav className="menu-admin menu-admin--movil" aria-label="Accesos rápidos">
        {NAV_MOVIL_ADMIN.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === RUTAS_ADMIN.panel}
            className={({ isActive }) =>
              `menu-admin__tab ${isActive ? 'menu-admin__tab--activo' : ''}`
            }
          >
            <IconoApp nombre={item.icono} />
            <span>{item.etiqueta}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={`menu-admin__tab ${menuAbierto ? 'menu-admin__tab--activo' : ''}`}
          onClick={onAlternarMenu}
          aria-expanded={menuAbierto}
          aria-label="Más opciones"
        >
          <IconoApp nombre="menu" />
          <span>Más</span>
        </button>
      </nav>

      {menuAbierto && (
        <div className="menu-admin__drawer" role="dialog" aria-modal="true" aria-label="Menú completo">
          <button
            type="button"
            className="menu-admin__drawer-fondo"
            onClick={onCerrarMenu}
            aria-label="Cerrar menú"
          />
          <div className="menu-admin__drawer-panel">
            <header className="menu-admin__drawer-cabecera">
              <h2>Menú</h2>
              <button type="button" onClick={onCerrarMenu} aria-label="Cerrar">
                <IconoApp nombre="cerrar" />
              </button>
            </header>
            <div className="menu-admin__drawer-cuerpo">
              {GRUPOS_MENU_ADMIN.map((grupo) => (
                <div key={grupo.id} className="menu-admin__grupo menu-admin__grupo--drawer">
                  {grupo.titulo && <p className="menu-admin__grupo-titulo">{grupo.titulo}</p>}
                  <ul className="menu-admin__lista">
                    {grupo.items.map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end={item.to === RUTAS_ADMIN.panel}
                          className={({ isActive }) => enlaceClase(isActive)}
                          onClick={onCerrarMenu}
                        >
                          <IconoApp nombre={item.icono} className="menu-admin__icono" />
                          {item.etiqueta}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MenuAdminSidebar;
