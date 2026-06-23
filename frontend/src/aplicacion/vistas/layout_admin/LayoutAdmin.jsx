import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ImagenAmpliable } from '../../../compartido/componentes';
import IconoApp from '../../../compartido/componentes/icono_app/IconoApp';
import MenuAdminSidebar, { MenuAdminMovil } from '../../../compartido/componentes/menu_admin/MenuAdmin';
import CampanaNotificacionesAdmin from '../../../componentes/admin/campana_notificaciones/CampanaNotificacionesAdmin';
import { RUTAS_PLATAFORMA, RUTAS_PUBLICAS } from '../../../compartido/constantes';
import { obtenerImpersonacion, limpiarImpersonacion } from '../../../compartido/utilidades/tokenSesion';
import { useAuth } from '../../proveedores/ProveedorAuth';
import '../../../estilos/layouts/layout_admin/layout_admin.css';

export default function LayoutAdmin() {
  const { usuario, marca, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const slugPublico = marca?.slug;
  const impersonando = obtenerImpersonacion();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  async function salirImpersonacion() {
    await cerrarSesion();
    limpiarImpersonacion();
    navigate(RUTAS_PLATAFORMA.marcas);
  }

  return (
    <div className="layout-admin">
      <aside className="layout-admin__sidebar">
        <div className="layout-admin__sidebar-marca">
          {marca?.logo ? (
            <ImagenAmpliable src={marca.logo} alt="" className="layout-admin__sidebar-logo" />
          ) : (
            <div className="layout-admin__sidebar-logo layout-admin__sidebar-logo--placeholder">
              {marca?.nombreComercial?.charAt(0) ?? 'M'}
            </div>
          )}
          <div>
            <strong>{marca?.nombreComercial ?? 'Mi empresa'}</strong>
            <span>Panel de gestión</span>
          </div>
        </div>

        <MenuAdminSidebar />

        <div className="layout-admin__sidebar-pie">
          {slugPublico && (
            <a
              className="layout-admin__sidebar-enlace"
              href={RUTAS_PUBLICAS.inicioMarca(slugPublico)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconoApp nombre="externo" />
              Ver app del cliente
            </a>
          )}
          {!impersonando && (
            <p className="layout-admin__sidebar-nota">
              ¿Otra empresa? <Link to={RUTAS_PLATAFORMA.login}>Ir a plataforma</Link>
            </p>
          )}
        </div>
      </aside>

      <div className="layout-admin__main">
        <header className="layout-admin__topbar">
          <div className="layout-admin__topbar-info">
            <p className="layout-admin__topbar-etiqueta">Bienvenida</p>
            <strong>{usuario?.nombre}</strong>
          </div>
          <div className="layout-admin__topbar-acciones">
            {slugPublico && (
              <a
                className="layout-admin__topbar-app"
                href={RUTAS_PUBLICAS.inicioMarca(slugPublico)}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir la app tal como la ven tus clientes"
                aria-label="Ver app del cliente en nueva pestaña"
              >
                <IconoApp nombre="externo" />
                <span>Vista cliente</span>
              </a>
            )}
            <CampanaNotificacionesAdmin />
            <button type="button" className="layout-admin__topbar-salir" onClick={cerrarSesion}>
              Salir
            </button>
          </div>
        </header>

        {impersonando && (
          <div className="layout-admin__impersonacion">
            <p>
              Modo soporte — panel de <strong>{impersonando}</strong>
            </p>
            <button type="button" onClick={salirImpersonacion}>
              Volver a Mis marcas
            </button>
          </div>
        )}

        <main className="layout-admin__contenido">
          <Outlet />
        </main>
      </div>

      <MenuAdminMovil
        menuAbierto={menuMovilAbierto}
        onAlternarMenu={() => setMenuMovilAbierto((prev) => !prev)}
        onCerrarMenu={() => setMenuMovilAbierto(false)}
      />
    </div>
  );
}
