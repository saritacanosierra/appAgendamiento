import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import '../../estilos/compartido/aviso_toast/aviso_toast.css';

const ContextoAvisos = createContext(null);

export function ProveedorAvisos({ children }) {
  const [avisos, setAvisos] = useState([]);

  const cerrar = useCallback((id) => {
    setAvisos((prev) => prev.filter((aviso) => aviso.id !== id));
  }, []);

  const mostrar = useCallback((mensaje, variante) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setAvisos((prev) => [...prev.slice(-3), { id, mensaje, variante }]);
    window.setTimeout(() => cerrar(id), 4200);
  }, [cerrar]);

  const valor = useMemo(() => ({
    exito: (mensaje) => mostrar(mensaje, 'exito'),
    error: (mensaje) => mostrar(mensaje, 'error'),
    info: (mensaje) => mostrar(mensaje, 'info'),
  }), [mostrar]);

  return (
    <ContextoAvisos.Provider value={valor}>
      {children}
      <div className="aviso-toast" aria-live="polite" aria-atomic="true">
        {avisos.map((aviso) => (
          <button
            key={aviso.id}
            type="button"
            className={`aviso-toast__item aviso-toast__item--${aviso.variante}`}
            onClick={() => cerrar(aviso.id)}
          >
            {aviso.mensaje}
          </button>
        ))}
      </div>
    </ContextoAvisos.Provider>
  );
}

export function useAvisos() {
  const contexto = useContext(ContextoAvisos);
  if (!contexto) {
    throw new Error('useAvisos debe usarse dentro de ProveedorAvisos');
  }
  return contexto;
}
