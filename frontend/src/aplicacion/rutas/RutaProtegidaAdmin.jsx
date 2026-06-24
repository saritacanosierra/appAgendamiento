import { Navigate, useLocation } from 'react-router-dom';
import { Cargando } from '../../compartido/componentes';
import { RUTAS_ADMIN, RUTAS_PLATAFORMA } from '../../compartido/constantes';
import { PLATAFORMA_HABILITADA } from '../../compartido/configuracion/entornoApp';
import { useAuthMarca } from '../proveedores/ProveedorAuth';

const ROLES_MARCA = new Set(['admin', 'staff']);

export default function RutaProtegidaAdmin({ children }) {
  const { autenticado, cargando, usuario } = useAuthMarca();
  const ubicacion = useLocation();

  if (cargando) {
    return <Cargando mensaje="Verificando sesion..." />;
  }

  if (!autenticado) {
    return (
      <Navigate
        to={RUTAS_ADMIN.login}
        state={{ desde: `${ubicacion.pathname}${ubicacion.search}` }}
        replace
      />
    );
  }

  if (usuario?.rol === 'superadmin') {
    if (PLATAFORMA_HABILITADA) {
      return <Navigate to={RUTAS_PLATAFORMA.panel} replace />;
    }
    return <Navigate to={RUTAS_ADMIN.login} replace />;
  }

  if (!ROLES_MARCA.has(usuario?.rol)) {
    return <Navigate to={RUTAS_ADMIN.login} replace />;
  }

  if (!usuario?.marcaId) {
    return <Navigate to={RUTAS_ADMIN.login} replace />;
  }

  return children;
}
