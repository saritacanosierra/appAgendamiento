import { Outlet, useParams } from 'react-router-dom';
import { ProveedorMarca } from '../../proveedores/ProveedorMarca';
import { MenuMovilPublico } from '../../../compartido/componentes';
import '../../../estilos/layouts/layout_publico/layout_publico.css';

export default function LayoutPublico() {
  const { slug } = useParams();

  return (
    <ProveedorMarca slug={slug}>
      <div className="layout-publico">
        <main className="layout-publico__contenido contenedor-app">
          <Outlet />
        </main>
        <MenuMovilPublico />
      </div>
    </ProveedorMarca>
  );
}
