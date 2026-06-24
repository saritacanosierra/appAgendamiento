import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { aplicarTemaMarca } from '../../compartido/utilidades/temaMarca';
import { VARIABLES_MARCA_DEFECTO } from '../../compartido/constantes';
import { obtenerMarcaPorSlug } from '../../modulos/publico_marca/servicios/marcaServicio';

const ContextoMarca = createContext(null);

export function ProveedorMarca({ slug, children }) {
  const [marca, setMarca] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;

    let cancelado = false;
    setMarca(null);
    setCargando(true);
    setError(null);
    aplicarTemaMarca(VARIABLES_MARCA_DEFECTO);

    obtenerMarcaPorSlug(slug)
      .then((datos) => {
        if (!cancelado) setMarca(datos);
      })
      .catch((err) => {
        if (!cancelado) {
          setMarca(null);
          setError(err.message ?? 'No se pudo cargar la marca.');
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [slug]);

  useEffect(() => {
    if (marca) {
      aplicarTemaMarca(marca);
    } else {
      aplicarTemaMarca(VARIABLES_MARCA_DEFECTO);
    }
  }, [marca]);

  const valor = useMemo(
    () => ({ marca, cargando, error, setMarca }),
    [marca, cargando, error]
  );

  return <ContextoMarca.Provider value={valor}>{children}</ContextoMarca.Provider>;
}

export function useMarca() {
  const contexto = useContext(ContextoMarca);

  if (!contexto) {
    throw new Error('useMarca debe usarse dentro de ProveedorMarca');
  }

  return contexto;
}
