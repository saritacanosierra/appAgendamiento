import { Navigate, useLocation } from 'react-router-dom';
import { Cargando } from '../../compartido/componentes';
import { RUTAS_ADMIN } from '../../compartido/constantes';
import { useAuth } from '../proveedores/ProveedorAuth';

export default function RutaProtegidaAdmin({ children }) {
  const { autenticado, cargando } = useAuth();
  const ubicacion = useLocation();

  if (cargando) {
    return <Cargando mensaje="Verificando sesion..." />;
  }

  if (!autenticado) {
    return <Navigate to={RUTAS_ADMIN.login} state={{ desde: ubicacion.pathname }} replace />;
  }

  return children;
}
