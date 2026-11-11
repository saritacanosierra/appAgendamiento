import { Outlet, useParams } from 'react-router-dom';
import { ProveedorMarca } from '../../proveedores/ProveedorMarca';
import SeoMarcaPublica from '../../../componentes/publico/seo_marca/SeoMarcaPublica';
import { MenuMovilPublico } from '../../../compartido/componentes';
import '../../../estilos/layouts/layout_publico/layout_publico.css';

function ContenidoPublico() {
  return (
    <div className="layout-publico">
      <SeoMarcaPublica />
      <main className="layout-publico__contenido contenedor-app">
        <Outlet />
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
