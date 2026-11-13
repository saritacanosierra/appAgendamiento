import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BotonPrincipal, CampoFormulario, Cargando, MensajeError } from '../../../compartido/componentes';
import { RUTAS_ADMIN, RUTAS_PLATAFORMA } from '../../../compartido/constantes';
import { PLATAFORMA_HABILITADA } from '../../../compartido/configuracion/entornoApp';
import { useAuth } from '../../../aplicacion/proveedores/ProveedorAuth';
import { solicitarRecuperacion } from '../../../modulos/autenticacion/servicios/autenticacionServicio';
import { ModalPortal } from '../../../compartido/utilidades/modalPortal';
import { esRutaPlataforma } from '../../../compartido/utilidades/rutasApp';
import '../../../estilos/admin/login/login.css';

const ROLES_MARCA = new Set(['admin', 'staff']);

const MODOS = {
  plataforma: {
    id: 'plataforma',
    titulo: 'Administrador de plataforma',
    descripcion: 'Crea y gestiona varias marcas (DaniSpa, AlejaNails, etc.)',
    correoDemo: 'saritacanosierra@gmail.com',
    destinoDefecto: RUTAS_PLATAFORMA.marcas,
    urlLogin: RUTAS_PLATAFORMA.login,
    rolEsperado: 'superadmin',
  },
  marca: {
    id: 'marca',
    titulo: 'Panel de tu marca',
    descripcion: 'Este acceso es para propietarios. Aquí gestionas tus gastos, tus citas y el contenido de tu marca.',
    correoDemo: 'admin@lunanails.test',
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
  const [recuperando, setRecuperando] = useState(false);
  const [modalRecuperar, setModalRecuperar] = useState(false);
  const [correoRecuperar, setCorreoRecuperar] = useState('');
  const [celularRecuperar, setCelularRecuperar] = useState('');
  const [erroresModal, setErroresModal] = useState({});
  const [avisoRecuperacion, setAvisoRecuperacion] = useState('');

  useEffect(() => {
    setCorreo(config.correoDemo);
    setContrasena('');
    setError(null);
    setErroresCampo({});
    setAvisoRecuperacion('');
    setModalRecuperar(false);
  }, [modoActivo, config.correoDemo]);

  useEffect(() => {
    if (!modalRecuperar) return undefined;
    function cerrarConEscape(evento) {
      if (evento.key === 'Escape') setModalRecuperar(false);
    }
    window.addEventListener('keydown', cerrarConEscape);
    return () => window.removeEventListener('keydown', cerrarConEscape);
  }, [modalRecuperar]);

  function abrirRecuperacion() {
    setCorreoRecuperar(correo.trim());
    setCelularRecuperar('');
    setErroresModal({});
    setAvisoRecuperacion('');
    setModalRecuperar(true);
  }

  async function pedirRecuperacion(evento) {
    evento.preventDefault();
    const correoLimpio = correoRecuperar.trim();
    const celularLimpio = celularRecuperar.trim();
    const errores = {};
    if (!correoLimpio || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
      errores.correo = 'Escribe el correo de tu cuenta.';
    }
    if (celularLimpio.replace(/\D/g, '').length < 10) {
      errores.celular = 'Escribe el celular de tu marca, con al menos 10 dígitos.';
    }
    setErroresModal(errores);
    setAvisoRecuperacion('');
    if (Object.keys(errores).length > 0) return;

    setRecuperando(true);
    try {
      const respuesta = await solicitarRecuperacion(correoLimpio, celularLimpio, modoActivo);
      setAvisoRecuperacion(
        respuesta.mensaje
        || 'Si el correo y el celular coinciden, enviamos un enlace a ese correo para cambiar la contraseña.'
      );
    } catch (err) {
      if (err.datos?.errores) setErroresModal(err.datos.errores);
      setAvisoRecuperacion(err.message ?? 'No se pudo enviar el correo.');
    } finally {
      setRecuperando(false);
    }
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
    <>
    <div className={`login-vista login-vista--${modoActivo}`}>
      <div className={`login-vista__tarjeta login-vista__tarjeta--${modoActivo}`}>
        <span className={`login-vista__badge login-vista__badge--${modoActivo}`}>
          {modoActivo === 'plataforma' ? 'Control total SaaS' : 'Administrador  de Marca'}
        </span>
        <h1>{config.titulo}</h1>
        {modoActivo === 'plataforma' && <p className="login-vista__url">{config.urlLogin}</p>}
        <p>{config.descripcion}</p>
        {modoActivo === 'marca' && (
          <ul className="login-vista__usos">
            <li>Tus citas y tu agenda</li>
            <li>Tus gastos</li>
            <li>Galería, blog y el resto del contenido</li>
          </ul>
        )}

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
          <button
            type="button"
            className="login-vista__recuperar"
            onClick={abrirRecuperacion}
          >
            Recuperar contraseña
          </button>
          <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={enviando}>
            {enviando ? 'Entrando...' : (modoActivo === 'marca' ? 'Entrar a mi marca' : 'Entrar')}
          </BotonPrincipal>
        </form>

        <p className="login-vista__alterno">
          <Link to="/">← Volver al inicio</Link>
        </p>
      </div>
    </div>
    <ModalPortal abierto={modalRecuperar}>
      <div
        className={`login-recuperar login-recuperar--${modoActivo}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recuperar-titulo"
      >
        <button
          type="button"
          className="login-recuperar__fondo"
          aria-label="Cerrar"
          onClick={() => setModalRecuperar(false)}
        />
        <div className="login-recuperar__panel">
          <header className="login-recuperar__cabecera">
            <h2 id="recuperar-titulo">Recuperar contraseña</h2>
            <button
              type="button"
              className="login-recuperar__cerrar"
              onClick={() => setModalRecuperar(false)}
            >
              Cerrar
            </button>
          </header>
          <p className="login-recuperar__ayuda">
            Escribe el correo y el celular de tu marca. Solo si coinciden enviamos a ese correo el enlace para cambiar la contraseña. Si no coinciden, no enviamos nada.
          </p>
          <form className="login-vista__formulario" onSubmit={pedirRecuperacion}>
            <CampoFormulario etiqueta="Correo" id="correo-recuperar" requerido error={erroresModal.correo}>
              <input
                id="correo-recuperar"
                type="email"
                value={correoRecuperar}
                onChange={(e) => setCorreoRecuperar(e.target.value)}
                autoComplete="email"
                required
              />
            </CampoFormulario>
            <CampoFormulario etiqueta="Celular" id="celular-recuperar" requerido error={erroresModal.celular}>
              <input
                id="celular-recuperar"
                type="tel"
                value={celularRecuperar}
                onChange={(e) => setCelularRecuperar(e.target.value)}
                autoComplete="tel"
                inputMode="tel"
                placeholder="300 123 4567"
                required
              />
            </CampoFormulario>
            {avisoRecuperacion && <p className="login-vista__aviso">{avisoRecuperacion}</p>}
            <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={recuperando}>
              {recuperando ? 'Enviando...' : 'Enviar enlace al correo'}
            </BotonPrincipal>
          </form>
        </div>
      </div>
    </ModalPortal>
    </>
  );
}
