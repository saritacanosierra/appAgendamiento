import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  cerrarSesion as cerrarSesionApi,
  iniciarSesion as iniciarSesionApi,
  obtenerSesionActual,
} from '../../modulos/autenticacion/servicios/autenticacionServicio';
import { VARIABLES_MARCA_DEFECTO } from '../../compartido/constantes';
import { aplicarTemaMarca } from '../../compartido/utilidades/temaMarca';
import { obtenerToken } from '../../compartido/utilidades/tokenSesion';

const ContextoAuth = createContext(null);

export function ProveedorAuth({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [marca, setMarca] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarSesion = useCallback(async () => {
    const token = obtenerToken();
    if (!token) {
      setUsuario(null);
      setMarca(null);
      setCargando(false);
      return;
    }

    try {
      const respuesta = await obtenerSesionActual();
      setUsuario(respuesta.datos.usuario);
      setMarca(respuesta.datos.marca);
    } catch {
      setUsuario(null);
      setMarca(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarSesion();
  }, [cargarSesion]);

  useEffect(() => {
    if (marca) {
      aplicarTemaMarca(marca);
    } else if (!cargando) {
      aplicarTemaMarca(VARIABLES_MARCA_DEFECTO);
    }
  }, [marca, cargando]);

  const iniciarSesion = useCallback(async (correo, contrasena) => {
    const datos = await iniciarSesionApi(correo, contrasena);
    setUsuario(datos.usuario);
    setMarca(datos.marca);
    return datos;
  }, []);

  const cerrarSesion = useCallback(async () => {
    await cerrarSesionApi();
    setUsuario(null);
    setMarca(null);
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      marca,
      cargando,
      autenticado: Boolean(usuario),
      iniciarSesion,
      cerrarSesion,
      recargarSesion: cargarSesion,
    }),
    [usuario, marca, cargando, iniciarSesion, cerrarSesion, cargarSesion]
  );

  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>;
}

export function useAuth() {
  const contexto = useContext(ContextoAuth);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de ProveedorAuth');
  }
  return contexto;
}
