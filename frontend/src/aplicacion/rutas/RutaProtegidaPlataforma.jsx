import { Navigate, useLocation } from 'react-router-dom';
import { Cargando } from '../../compartido/componentes';
import { RUTAS_PLATAFORMA } from '../../compartido/constantes';
import { PLATAFORMA_HABILITADA } from '../../compartido/configuracion/entornoApp';
import { useAuthPlataforma } from '../proveedores/ProveedorAuth';

export default function RutaProtegidaPlataforma({ children }) {
  const { autenticado, cargando, usuario } = useAuthPlataforma();
  const ubicacion = useLocation();

  if (!PLATAFORMA_HABILITADA) {
    return <Navigate to="/" replace />;
  }

  if (cargando) {
    return <Cargando mensaje="Verificando sesion..." />;
  }

  if (!autenticado) {
    return (
      <Navigate
        to={RUTAS_PLATAFORMA.login}
        state={{ desde: `${ubicacion.pathname}${ubicacion.search}` }}
        replace
      />
    );
  }

  if (usuario?.rol !== 'superadmin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
