import { Outlet, useNavigate } from 'react-router-dom';
import MenuPlataforma from '../../../compartido/componentes/menu_plataforma/MenuPlataforma';
import { BotonPrincipal } from '../../../compartido/componentes';
import { RUTAS_PLATAFORMA } from '../../../compartido/constantes';
import { useAuthPlataforma } from '../../proveedores/ProveedorAuth';
import '../../../estilos/plataforma/layout/layout_plataforma.css';

export default function LayoutPlataforma() {
  const { usuario, cerrarSesion } = useAuthPlataforma();
  const navigate = useNavigate();

  async function salir() {
    await cerrarSesion();
    navigate(RUTAS_PLATAFORMA.login);
  }

  return (
    <div className="layout-plataforma">
      <header className="layout-plataforma__cabecera contenedor-admin">
        <div>
          <p className="layout-plataforma__etiqueta">Superadmin — control total</p>
          <h1>Administracion de la plataforma</h1>
          <p className="layout-plataforma__usuario">
            {usuario?.nombre} — crea empresas, revisa reportes y supervisa el SaaS
          </p>
        </div>
        <BotonPrincipal variante="secundario" onClick={salir}>Cerrar sesion</BotonPrincipal>
      </header>
      <main className="layout-plataforma__contenido contenedor-admin">
        <MenuPlataforma />
        <Outlet />
      </main>
    </div>
  );
}
