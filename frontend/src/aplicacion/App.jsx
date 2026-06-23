import { BrowserRouter } from 'react-router-dom';
import { ProveedorAuth } from './proveedores/ProveedorAuth';
import RutasApp from './rutas/RutasApp';

export default function App() {
  return (
    <BrowserRouter>
      <ProveedorAuth>
        <RutasApp />
      </ProveedorAuth>
    </BrowserRouter>
  );
}
