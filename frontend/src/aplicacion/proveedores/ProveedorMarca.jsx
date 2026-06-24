import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { aplicarTemaMarca } from '../../compartido/utilidades/temaMarca';
import { VARIABLES_MARCA_DEFECTO } from '../../compartido/constantes';
import { obtenerMarcaPorSlug } from '../../modulos/publico_marca/servicios/marcaServicio';

const ContextoMarca = createContext(null);

function VistaMarcaNoDisponible({ mensaje }) {
  return (
    <div className="marca-no-disponible">
      <div className="marca-no-disponible__contenido tarjeta-app">
        <h1>Servicio no disponible</h1>
        <p>{mensaje}</p>
        <p className="marca-no-disponible__ayuda">
          Si eres cliente, intenta mas tarde. Si administras este negocio, contacta al soporte de la plataforma.
        </p>
      </div>
    </div>
  );
}

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

  if (cargando) {
    return <div className="marca-no-disponible marca-no-disponible--cargando">Cargando...</div>;
  }

  if (error || !marca) {
    return <VistaMarcaNoDisponible mensaje={error ?? 'Marca no encontrada.'} />;
  }

  return <ContextoMarca.Provider value={valor}>{children}</ContextoMarca.Provider>;
}

export function useMarca() {
  const contexto = useContext(ContextoMarca);

  if (!contexto) {
    throw new Error('useMarca debe usarse dentro de ProveedorMarca');
  }

  return contexto;
}
