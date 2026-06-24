import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import {
  cerrarSesion as cerrarSesionApi,
  iniciarSesion as iniciarSesionApi,
  obtenerSesionMarca,
  obtenerSesionPlataforma,
} from '../../modulos/autenticacion/servicios/autenticacionServicio';
import { EVENTO_TOKEN_CAMBIADO, VARIABLES_MARCA_DEFECTO } from '../../compartido/constantes';
import { aplicarTemaMarca } from '../../compartido/utilidades/temaMarca';
import { esRutaPlataforma, esRutaPublicaMarca } from '../../compartido/utilidades/rutasApp';
import {
  CLAVES_TOKEN_SESION,
  limpiarTokenMarca,
  limpiarTokenPlataforma,
  obtenerTokenMarca,
  obtenerTokenPlataforma,
} from '../../compartido/utilidades/tokenSesion';

const ContextoAuth = createContext(null);

const SESION_VACIA = { usuario: null, marca: null, cargando: false };

export function ProveedorAuth({ children }) {
  const location = useLocation();
  const enPlataforma = esRutaPlataforma(location.pathname);
  const enRutaPublicaMarca = esRutaPublicaMarca(location.pathname);

  const [sesionMarca, setSesionMarca] = useState({ ...SESION_VACIA, cargando: true });
  const [sesionPlataforma, setSesionPlataforma] = useState({ ...SESION_VACIA, cargando: true });

  const cargarSesionMarca = useCallback(async () => {
    const token = obtenerTokenMarca();
    if (!token) {
      setSesionMarca({ ...SESION_VACIA, cargando: false });
      return;
    }

    try {
      const respuesta = await obtenerSesionMarca();
      setSesionMarca({
        usuario: respuesta.datos.usuario,
        marca: respuesta.datos.marca,
        cargando: false,
      });
    } catch {
      limpiarTokenMarca();
      setSesionMarca({ ...SESION_VACIA, cargando: false });
    }
  }, []);

  const cargarSesionPlataforma = useCallback(async () => {
    const token = obtenerTokenPlataforma();
    if (!token) {
      setSesionPlataforma({ ...SESION_VACIA, cargando: false });
      return;
    }

    try {
      const respuesta = await obtenerSesionPlataforma();
      setSesionPlataforma({
        usuario: respuesta.datos.usuario,
        marca: respuesta.datos.marca,
        cargando: false,
      });
    } catch {
      limpiarTokenPlataforma();
      setSesionPlataforma({ ...SESION_VACIA, cargando: false });
    }
  }, []);

  const cargarSesiones = useCallback(async () => {
    await Promise.all([cargarSesionMarca(), cargarSesionPlataforma()]);
  }, [cargarSesionMarca, cargarSesionPlataforma]);

  useEffect(() => {
    cargarSesiones();
  }, [cargarSesiones]);

  useEffect(() => {
    function sincronizarSesion(evento) {
      if (evento.type === 'storage') {
        if (!CLAVES_TOKEN_SESION.includes(evento.key)) return;
      }
      cargarSesiones();
    }

    window.addEventListener('storage', sincronizarSesion);
    window.addEventListener('focus', cargarSesiones);
    window.addEventListener(EVENTO_TOKEN_CAMBIADO, sincronizarSesion);

    return () => {
      window.removeEventListener('storage', sincronizarSesion);
      window.removeEventListener('focus', cargarSesiones);
      window.removeEventListener(EVENTO_TOKEN_CAMBIADO, sincronizarSesion);
    };
  }, [cargarSesiones]);

  const sesionActiva = enPlataforma ? sesionPlataforma : sesionMarca;

  useEffect(() => {
    /* El tema de cada marca publica lo controla ProveedorMarca en /m/:slug */
    if (sesionActiva.cargando || enPlataforma || enRutaPublicaMarca) return;

    if (sesionActiva.marca) {
      aplicarTemaMarca(sesionActiva.marca);
    } else {
      aplicarTemaMarca(VARIABLES_MARCA_DEFECTO);
    }
  }, [sesionActiva.marca, sesionActiva.cargando, enPlataforma, enRutaPublicaMarca]);

  const iniciarSesion = useCallback(async (correo, contrasena, contexto = 'marca') => {
    const datos = await iniciarSesionApi(correo, contrasena, contexto);

    if (contexto === 'plataforma') {
      setSesionPlataforma({
        usuario: datos.usuario,
        marca: datos.marca,
        cargando: false,
      });
    } else {
      setSesionMarca({
        usuario: datos.usuario,
        marca: datos.marca,
        cargando: false,
      });
    }

    return datos;
  }, []);

  const cerrarSesion = useCallback(async (contexto = enPlataforma ? 'plataforma' : 'marca') => {
    await cerrarSesionApi(contexto);

    if (contexto === 'plataforma') {
      setSesionPlataforma({ ...SESION_VACIA, cargando: false });
    } else {
      setSesionMarca({ ...SESION_VACIA, cargando: false });
    }
  }, [enPlataforma]);

  const valor = useMemo(
    () => ({
      usuario: sesionActiva.usuario,
      marca: sesionActiva.marca,
      cargando: sesionActiva.cargando,
      autenticado: Boolean(sesionActiva.usuario),
      sesionMarca,
      sesionPlataforma,
      autenticadoMarca: Boolean(sesionMarca.usuario),
      autenticadoPlataforma: Boolean(sesionPlataforma.usuario),
      usuarioMarca: sesionMarca.usuario,
      usuarioPlataforma: sesionPlataforma.usuario,
      marcaActiva: sesionMarca.marca,
      iniciarSesion,
      cerrarSesion,
      recargarSesion: cargarSesiones,
      recargarSesionMarca: cargarSesionMarca,
      recargarSesionPlataforma: cargarSesionPlataforma,
    }),
    [
      sesionActiva,
      sesionMarca,
      sesionPlataforma,
      iniciarSesion,
      cerrarSesion,
      cargarSesiones,
      cargarSesionMarca,
      cargarSesionPlataforma,
    ]
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

export function useAuthMarca() {
  const auth = useAuth();
  return {
    usuario: auth.usuarioMarca,
    marca: auth.marcaActiva,
    cargando: auth.sesionMarca.cargando,
    autenticado: auth.autenticadoMarca,
    cerrarSesion: () => auth.cerrarSesion('marca'),
    recargarSesion: auth.recargarSesionMarca,
  };
}

export function useAuthPlataforma() {
  const auth = useAuth();
  return {
    usuario: auth.usuarioPlataforma,
    cargando: auth.sesionPlataforma.cargando,
    autenticado: auth.autenticadoPlataforma,
    cerrarSesion: () => auth.cerrarSesion('plataforma'),
    recargarSesion: auth.recargarSesionPlataforma,
  };
}
