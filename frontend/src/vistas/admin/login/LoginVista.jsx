import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BotonPrincipal, CampoFormulario, Cargando, MensajeError } from '../../../compartido/componentes';
import { RUTAS_ADMIN, RUTAS_PLATAFORMA } from '../../../compartido/constantes';
import { PLATAFORMA_HABILITADA } from '../../../compartido/configuracion/entornoApp';
import { useAuth } from '../../../aplicacion/proveedores/ProveedorAuth';
import { esRutaPlataforma } from '../../../compartido/utilidades/rutasApp';
import '../../../estilos/admin/login/login.css';

const ROLES_MARCA = new Set(['admin', 'staff']);

const MODOS = {
  plataforma: {
    id: 'plataforma',
    titulo: 'Administrador de plataforma',
    descripcion: 'Crea y gestiona varias marcas (DaniSpa, AlejaNails, etc.)',
    correoDemo: 'saritacanosierra@gmail.com',
    contrasenaDemo: '123456789',
    destinoDefecto: RUTAS_PLATAFORMA.marcas,
    urlLogin: RUTAS_PLATAFORMA.login,
    rolEsperado: 'superadmin',
  },
  marca: {
    id: 'marca',
    titulo: 'Panel de administración',
    descripcion: 'Gestiona tu negocio: perfil, agenda, galería y blog',
    correoDemo: 'admin@lunanails.test',
    contrasenaDemo: 'Admin123!',
    destinoDefecto: RUTAS_ADMIN.panel,
    urlLogin: RUTAS_ADMIN.login,
    rolEsperado: 'marca',
  },
};

function destinoPorRol(usuario, destinoSolicitado) {
  if (usuario?.rol === 'superadmin') {
    if (esRutaPlataforma(destinoSolicitado)) return destinoSolicitado;
    return RUTAS_PLATAFORMA.marcas;
  }
  if (esRutaPlataforma(destinoSolicitado)) return RUTAS_ADMIN.panel;
  return destinoSolicitado;
}

function sesionCoincideConModo(usuario, modoActivo) {
  if (!usuario) return false;
  if (modoActivo === 'plataforma') return usuario.rol === 'superadmin';
  return ROLES_MARCA.has(usuario.rol);
}

function rolPermitidoEnModo(rol, modoActivo) {
  if (modoActivo === 'plataforma') return rol === 'superadmin';
  return ROLES_MARCA.has(rol);
}

export default function LoginVista({ modo = 'marca' }) {
  const modoActivo = MODOS[modo] ? modo : 'marca';
  const config = MODOS[modoActivo];

  const {
    autenticadoMarca,
    autenticadoPlataforma,
    sesionMarca,
    sesionPlataforma,
    iniciarSesion,
    cerrarSesion,
  } = useAuth();
  const navigate = useNavigate();
  const ubicacion = useLocation();
  const destinoSolicitado = ubicacion.state?.desde ?? config.destinoDefecto;

  const autenticado = modoActivo === 'plataforma' ? autenticadoPlataforma : autenticadoMarca;
  const cargando = modoActivo === 'plataforma'
    ? sesionPlataforma.cargando
    : sesionMarca.cargando;
  const usuario = modoActivo === 'plataforma'
    ? sesionPlataforma.usuario
    : sesionMarca.usuario;

  const [correo, setCorreo] = useState(config.correoDemo);
  const [contrasena, setContrasena] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [error, setError] = useState(null);
  const [erroresCampo, setErroresCampo] = useState({});

  useEffect(() => {
    setCorreo(config.correoDemo);
    setContrasena('');
    setError(null);
    setErroresCampo({});
  }, [modoActivo, config.correoDemo]);

  function usarCredencialesDemo() {
    setCorreo(config.correoDemo);
    setContrasena(config.contrasenaDemo);
  }

  async function manejarCerrarSesion() {
    setCerrandoSesion(true);
    await cerrarSesion(modoActivo === 'plataforma' ? 'plataforma' : 'marca');
    setCerrandoSesion(false);
  }

  if (modoActivo === 'plataforma' && !PLATAFORMA_HABILITADA) {
    return <Navigate to="/" replace />;
  }

  if (cargando) return <Cargando mensaje="Verificando sesion..." />;

  if (autenticado && sesionCoincideConModo(usuario, modoActivo)) {
    return <Navigate to={destinoPorRol(usuario, destinoSolicitado)} replace />;
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    setError(null);
    setErroresCampo({});
    setEnviando(true);

    try {
      const contexto = modoActivo === 'plataforma' ? 'plataforma' : 'marca';
      const datos = await iniciarSesion(correo.trim(), contrasena, contexto);
      const rol = datos.usuario?.rol;

      if (!rolPermitidoEnModo(rol, modoActivo)) {
        await cerrarSesion(contexto);
        setError('Credenciales invalidas o sin permiso para acceder.');
        return;
      }

      navigate(destinoPorRol(datos.usuario, destinoSolicitado), { replace: true });
    } catch (err) {
      if (err.datos?.errores) {
        setErroresCampo(err.datos.errores);
      }
      setError(err.message ?? 'No se pudo iniciar sesion.');
    } finally {
      setEnviando(false);
    }
  }

  const sesionConflictiva = autenticado && !sesionCoincideConModo(usuario, modoActivo);
  const otraSesionActiva = modoActivo === 'plataforma' ? autenticadoMarca : autenticadoPlataforma;

  return (
    <div className={`login-vista login-vista--${modoActivo}`}>
      <div className={`login-vista__tarjeta login-vista__tarjeta--${modoActivo}`}>
        <span className={`login-vista__badge login-vista__badge--${modoActivo}`}>
          {modoActivo === 'plataforma' ? 'Control total SaaS' : 'Panel de tu marca'}
        </span>
        <h1>{config.titulo}</h1>
        <p className="login-vista__url">{config.urlLogin}</p>
        <p>{config.descripcion}</p>

        {modoActivo === 'plataforma' && (
          <p className="login-vista__destino">
            Tras entrar: <strong>Mis marcas</strong> → <strong>+ Agregar marca</strong>
          </p>
        )}

        {sesionConflictiva && (
          <div className="login-vista__conflicto">
            <p>
              Tienes otra sesion activa como <strong>{usuario.correo}</strong>.
            </p>
            <p>Cierra esa sesion para entrar con otra cuenta, o continua abajo.</p>
            <BotonPrincipal variante="secundario" onClick={manejarCerrarSesion} deshabilitado={cerrandoSesion}>
              {cerrandoSesion ? 'Cerrando...' : 'Cerrar sesion actual'}
            </BotonPrincipal>
          </div>
        )}

        {!sesionConflictiva && otraSesionActiva && (
          <p className="login-vista__sesion-paralela">
            Tambien puedes mantener abierta la otra sesion en otra pestana
            ({modoActivo === 'plataforma' ? 'panel de marca' : 'plataforma superadmin'}).
          </p>
        )}

        {error && <MensajeError titulo="Error de acceso" mensaje={error} />}

        <form className="login-vista__formulario" onSubmit={manejarSubmit}>
          <CampoFormulario etiqueta="Correo" id="correo" requerido error={erroresCampo.correo}>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder={config.correoDemo}
              autoComplete="email"
              required
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Contrasena" id="contrasena" requerido error={erroresCampo.contrasena}>
            <input
              id="contrasena"
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              autoComplete="current-password"
              required
            />
          </CampoFormulario>
          {import.meta.env.DEV && (
            <button type="button" className="login-vista__demo" onClick={usarCredencialesDemo}>
              Usar credenciales demo
            </button>
          )}
          <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={enviando}>
            {enviando ? 'Entrando...' : 'Entrar'}
          </BotonPrincipal>
        </form>

        <p className="login-vista__alterno">
          <Link to="/">← Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
}
