import { BrowserRouter } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { ProveedorAuth } from './proveedores/ProveedorAuth';
import { ProveedorVisorImagen } from './proveedores/ProveedorVisorImagen';
import RutasApp from './rutas/RutasApp';

export default function App() {
  return (
    <BrowserRouter>
      <ProveedorAuth>
        <ProveedorVisorImagen>
          <RutasApp />
        </ProveedorVisorImagen>
      </ProveedorAuth>
      <SpeedInsights />
    </BrowserRouter>
  );
}
