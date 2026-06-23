import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BotonPrincipal, CampoFormulario, Cargando, MensajeError } from '../../../compartido/componentes';
import { RUTAS_ADMIN } from '../../../compartido/constantes';
import { useAuth } from '../../../aplicacion/proveedores/ProveedorAuth';
import '../../../estilos/admin/login/login.css';

export default function LoginVista() {
  const { autenticado, cargando, iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const ubicacion = useLocation();
  const destino = ubicacion.state?.desde ?? RUTAS_ADMIN.panel;

  const [correo, setCorreo] = useState('admin@lunanails.test');
  const [contrasena, setContrasena] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [erroresCampo, setErroresCampo] = useState({});

  if (cargando) return <Cargando mensaje="Verificando sesion..." />;
  if (autenticado) return <Navigate to={destino} replace />;

  async function manejarSubmit(e) {
    e.preventDefault();
    setError(null);
    setErroresCampo({});
    setEnviando(true);

    try {
      await iniciarSesion(correo.trim(), contrasena);
      navigate(destino, { replace: true });
    } catch (err) {
      if (err.datos?.errores) {
        setErroresCampo(err.datos.errores);
      }
      setError(err.message ?? 'No se pudo iniciar sesion.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login-vista">
      <div className="login-vista__tarjeta">
        <h1>Iniciar sesion</h1>
        <p>Acceso al panel de tu marca</p>

        {error && <MensajeError titulo="Error de acceso" mensaje={error} />}

        <form className="login-vista__formulario" onSubmit={manejarSubmit}>
          <CampoFormulario etiqueta="Correo" id="correo" requerido error={erroresCampo.correo}>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="admin@lunanails.test"
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
          <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={enviando}>
            {enviando ? 'Entrando...' : 'Entrar'}
          </BotonPrincipal>
        </form>

        <p className="login-vista__ayuda">Demo: admin@lunanails.test / Admin123!</p>
      </div>
    </div>
  );
}
