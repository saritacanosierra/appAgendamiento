import { BrowserRouter } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { ProveedorAuth } from './proveedores/ProveedorAuth';
import { ProveedorVisorImagen } from './proveedores/ProveedorVisorImagen';
import LimiteError from '../compartido/componentes/limite_error/LimiteError';
import RutasApp from './rutas/RutasApp';

const basenameRouter = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

export default function App() {
  return (
    <BrowserRouter basename={basenameRouter}>
      <LimiteError>
        <ProveedorAuth>
          <ProveedorVisorImagen>
            <RutasApp />
          </ProveedorVisorImagen>
        </ProveedorAuth>
      </LimiteError>
      <SpeedInsights />
    </BrowserRouter>
  );
}
