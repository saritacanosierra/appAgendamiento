import { Outlet, useParams, Link } from 'react-router-dom';
import { ProveedorMarca } from '../../proveedores/ProveedorMarca';
import SeoMarcaPublica from '../../../componentes/publico/seo_marca/SeoMarcaPublica';
import { MenuMovilPublico } from '../../../compartido/componentes';
import { RUTAS_PUBLICAS } from '../../../compartido/constantes';
import '../../../estilos/layouts/layout_publico/layout_publico.css';

function ContenidoPublico() {
  const { slug } = useParams();
  const inicio = slug ? RUTAS_PUBLICAS.inicioMarca(slug) : '';
  const usoDatos = inicio
    ? `${RUTAS_PUBLICAS.usoDatos}?volver=${encodeURIComponent(inicio)}`
    : RUTAS_PUBLICAS.usoDatos;

  return (
    <div className="layout-publico">
      <SeoMarcaPublica />
      <main className="layout-publico__contenido contenedor-app">
        <Outlet />
        <Link className="layout-publico__condiciones" to={usoDatos}>
          Uso de tus datos
        </Link>
      </main>
      <MenuMovilPublico />
    </div>
  );
}

export default function LayoutPublico() {
  const { slug } = useParams();

  return (
    <ProveedorMarca slug={slug}>
      <ContenidoPublico />
    </ProveedorMarca>
  );
}
