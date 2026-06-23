import { Outlet } from 'react-router-dom';
import { BotonPrincipal, MenuAdmin } from '../../../compartido/componentes';
import { useAuth } from '../../proveedores/ProveedorAuth';
import '../../../estilos/layouts/layout_admin/layout_admin.css';

export default function LayoutAdmin() {
  const { usuario, marca, cerrarSesion } = useAuth();

  return (
    <div className="layout-admin">
      <header className="layout-admin__cabecera contenedor-admin">
        <div className="layout-admin__cabecera-fila">
          <div>
            <h1>{marca?.nombreComercial ?? 'Panel administrativo'}</h1>
            <p className="layout-admin__subtitulo">
              Hola, {usuario?.nombre} — {usuario?.rol}
            </p>
          </div>
          <BotonPrincipal variante="secundario" onClick={cerrarSesion}>
            Cerrar sesion
          </BotonPrincipal>
        </div>
      </header>
      <div className="contenedor-admin">
        <MenuAdmin />
        <main className="layout-admin__contenido">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
