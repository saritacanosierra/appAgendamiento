import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import VisorImagen from '../../compartido/componentes/visor_imagen/VisorImagen';

const VisorImagenContext = createContext(null);

export function useVisorImagen() {
  const contexto = useContext(VisorImagenContext);
  if (!contexto) {
    throw new Error('useVisorImagen debe usarse dentro de ProveedorVisorImagen');
  }
  return contexto;
}

export function ProveedorVisorImagen({ children }) {
  const [imagen, setImagen] = useState(null);

  const abrirImagen = useCallback(({ src, alt = '' }) => {
    if (!src) return;
    setImagen({ src, alt });
  }, []);

  const cerrarImagen = useCallback(() => {
    setImagen(null);
  }, []);

  const valor = useMemo(
    () => ({ abrirImagen, cerrarImagen, imagenAbierta: Boolean(imagen) }),
    [abrirImagen, cerrarImagen, imagen]
  );

  return (
    <VisorImagenContext.Provider value={valor}>
      {children}
      <VisorImagen imagen={imagen} onCerrar={cerrarImagen} />
    </VisorImagenContext.Provider>
  );
}
