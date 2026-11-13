import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { BotonPrincipal, CampoFormulario, MensajeError } from '../../../compartido/componentes';
import { RUTAS_ADMIN, RUTAS_PLATAFORMA } from '../../../compartido/constantes';
import { restablecerContrasena } from '../../../modulos/autenticacion/servicios/autenticacionServicio';
import '../../../estilos/admin/login/login.css';

export default function RestablecerContrasenaVista() {
  const ubicacion = useLocation();
  const [parametros] = useSearchParams();
  const token = parametros.get('token') ?? '';
  const modo = ubicacion.pathname.startsWith('/plataforma') ? 'plataforma' : 'marca';
  const volver = modo === 'plataforma' ? RUTAS_PLATAFORMA.login : RUTAS_ADMIN.login;

  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(token ? null : 'Este enlace no sirve. Pide otro desde el inicio de sesión.');
  const [listo, setListo] = useState(false);

  async function manejarSubmit(e) {
    e.preventDefault();
    setError(null);
    if (contrasena.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (contrasena !== confirmacion) {
      setError('Las dos contraseñas no coinciden.');
      return;
    }

    setEnviando(true);
    try {
      await restablecerContrasena(token, contrasena);
      setListo(true);
    } catch (err) {
      setError(err.message ?? 'No se pudo guardar la contraseña.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={`login-vista login-vista--${modo}`}>
      <div className="login-vista__tarjeta">
        <span className={`login-vista__badge login-vista__badge--${modo}`}>
          {modo === 'plataforma' ? 'Control total SaaS' : 'Administrador de Marca'}
        </span>
        <h1>Elige una contraseña nueva</h1>
        <p>Este enlace llega al correo de tu cuenta y sirve una sola vez.</p>

        {error && <MensajeError titulo="No se pudo continuar" mensaje={error} />}

        {listo && (
          <p className="login-vista__aviso">
            Contraseña actualizada. Ya puedes entrar con la nueva.
          </p>
        )}

        {!listo && token && (
          <form className="login-vista__formulario" onSubmit={manejarSubmit}>
            <CampoFormulario etiqueta="Contraseña nueva" id="contrasena-nueva" requerido>
              <input
                id="contrasena-nueva"
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </CampoFormulario>
            <CampoFormulario etiqueta="Repite la contraseña" id="contrasena-confirma" requerido>
              <input
                id="contrasena-confirma"
                type="password"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </CampoFormulario>
            <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={enviando || !token}>
              {enviando ? 'Guardando...' : 'Guardar contraseña'}
            </BotonPrincipal>
          </form>
        )}

        <p className="login-vista__alterno">
          <Link to={volver}>← Volver a entrar</Link>
        </p>
      </div>
    </div>
  );
}
