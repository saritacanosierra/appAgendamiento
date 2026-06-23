import { Navigate, useLocation } from 'react-router-dom';
import { Cargando } from '../../compartido/componentes';
import { RUTAS_ADMIN, RUTAS_PLATAFORMA } from '../../compartido/constantes';
import { useAuth } from '../proveedores/ProveedorAuth';

export default function RutaProtegidaPlataforma({ children }) {
  const { autenticado, cargando, usuario } = useAuth();
  const ubicacion = useLocation();

  if (cargando) {
    return <Cargando mensaje="Verificando sesion..." />;
  }

  if (!autenticado) {
    return <Navigate to={RUTAS_PLATAFORMA.login} state={{ desde: ubicacion.pathname }} replace />;
  }

  if (usuario?.rol !== 'superadmin') {
    return <Navigate to={RUTAS_ADMIN.panel} replace />;
  }

  return children;
}
