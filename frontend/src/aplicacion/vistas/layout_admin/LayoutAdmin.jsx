import { Link, Outlet, useNavigate } from 'react-router-dom';
import { BotonPrincipal, MenuAdmin } from '../../../compartido/componentes';
import { RUTAS_PLATAFORMA, RUTAS_PUBLICAS } from '../../../compartido/constantes';
import { obtenerImpersonacion, limpiarImpersonacion } from '../../../compartido/utilidades/tokenSesion';
import { useAuth } from '../../proveedores/ProveedorAuth';
import '../../../estilos/layouts/layout_admin/layout_admin.css';

export default function LayoutAdmin() {
  const { usuario, marca, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const slugPublico = marca?.slug;
  const impersonando = obtenerImpersonacion();

  async function salirImpersonacion() {
    await cerrarSesion();
    limpiarImpersonacion();
    navigate(RUTAS_PLATAFORMA.marcas);
  }

  return (
    <div className="layout-admin">
      <header className="layout-admin__cabecera contenedor-admin">
        <div className="layout-admin__cabecera-fila">
          <div>
            <p className="layout-admin__etiqueta">Panel de tu empresa</p>
            <h1>{marca?.nombreComercial ?? 'Panel administrativo'}</h1>
            <p className="layout-admin__subtitulo">
              Hola, {usuario?.nombre} — gestiona tu app: reservas, perfil, galeria y blog
            </p>
            {slugPublico && (
              <a
                className="layout-admin__sitio-publico"
                href={RUTAS_PUBLICAS.inicioMarca(slugPublico)}
                target="_blank"
                rel="noreferrer"
              >
                Ver sitio publico → /m/{slugPublico}
              </a>
            )}
          </div>
          <BotonPrincipal variante="secundario" onClick={cerrarSesion}>
            Cerrar sesion
          </BotonPrincipal>
        </div>
      </header>
      <div className="contenedor-admin">
        {impersonando && (
          <div className="layout-admin__impersonacion">
            <p>
              Modo soporte — estas viendo el panel de <strong>{impersonando}</strong> como superadmin.
            </p>
            <button type="button" onClick={salirImpersonacion}>
              Volver a Mis marcas
            </button>
          </div>
        )}
        {!impersonando && (
          <p className="layout-admin__aviso-marca">
            Estas en el panel de <strong>{marca?.nombreComercial}</strong> solamente.
            Para crear otras marcas (DaniSpa, AlejaNails…), cierra sesion e inicia en{' '}
            <Link to={RUTAS_PLATAFORMA.login}><strong>/plataforma/login</strong></Link>.
          </p>
        )}
        <MenuAdmin />
        <main className="layout-admin__contenido">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
