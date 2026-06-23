import { Navigate, useLocation } from 'react-router-dom';

/** Redirige URLs sin barra final para mantener rutas consistentes. */
export default function RedireccionBarraFinal() {
  const { pathname, search, hash } = useLocation();

  if (pathname === '/' || pathname.endsWith('/') || /\.\w+$/.test(pathname)) {
    return null;
  }

  return <Navigate to={`${pathname}/${search}${hash}`} replace />;
}
