import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './aplicacion/App';
import './estilos/global/base.css';
import './estilos/global/responsive.css';
import './estilos/global/vista_escritorio.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
