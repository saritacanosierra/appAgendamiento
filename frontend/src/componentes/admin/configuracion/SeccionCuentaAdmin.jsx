import { useEffect, useState } from 'react';
import {
  BotonPrincipal,
  CampoContrasena,
  CampoFormulario,
  InputTexto,
  MensajeError,
} from '../../../compartido/componentes';
import {
  actualizarPerfilAdminMarca,
  obtenerPerfilAdminMarca,
} from '../../../modulos/configuracion_marca/servicios/configuracionServicio';
import AcordeonSeccion from './AcordeonSeccion';

const VACIO = {
  nombre: '',
  correo: '',
  contrasenaActual: '',
  contrasenaNueva: '',
  contrasenaNueva2: '',
};

export default function SeccionCuentaAdmin({
  abierta,
  onAbrir,
  onGuardado,
  onMensaje,
}) {
  const [formulario, setFormulario] = useState(VACIO);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [erroresCampo, setErroresCampo] = useState({});

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerPerfilAdminMarca();
      setFormulario({
        ...VACIO,
        nombre: datos.usuario?.nombre ?? '',
        correo: datos.usuario?.correo ?? '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function cambiar(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  async function guardar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    setErroresCampo({});

    const cambiaClave = Boolean(
      formulario.contrasenaNueva.trim() || formulario.contrasenaActual.trim()
    );
    if (cambiaClave && formulario.contrasenaNueva !== formulario.contrasenaNueva2) {
      setErroresCampo({ contrasena_nueva: 'Las contraseñas nuevas no coinciden.' });
      setGuardando(false);
      return;
    }

    try {
      const payload = {
        nombre: formulario.nombre.trim(),
        correo: formulario.correo.trim().toLowerCase(),
      };
      if (cambiaClave) {
        payload.contrasena_actual = formulario.contrasenaActual;
        payload.contrasena_nueva = formulario.contrasenaNueva;
      }

      const datos = await actualizarPerfilAdminMarca(payload);
      setFormulario({
        ...VACIO,
        nombre: datos.usuario?.nombre ?? '',
        correo: datos.usuario?.correo ?? '',
      });
      if (onGuardado) await onGuardado();
      if (onMensaje) {
        onMensaje({
          titulo: 'Cuenta actualizada',
          mensaje: datos.contrasenaActualizada
            ? 'Nombre, correo y contraseña guardados. Otras sesiones se cerraron.'
            : 'Tu nombre y correo quedaron actualizados.',
          variante: 'exito',
        });
      }
    } catch (err) {
      setError(err.message);
      if (err.datos?.errores) setErroresCampo(err.datos.errores);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <AcordeonSeccion
      id="cuenta-admin"
      titulo="0. Mi cuenta (entrar y recuperar clave)"
      resumen="Tu nombre, correo y contraseña del panel"
      abierta={abierta}
      onAbrir={onAbrir}
    >
      {cargando ? (
        <p className="configuracion-marca__hint">Cargando tu cuenta…</p>
      ) : (
        <form className="configuracion-marca__cuenta" onSubmit={guardar}>
          <p className="configuracion-marca__hint">
            Este correo es con el que entras a /admin y recibes el enlace si olvidas la contraseña
            (junto con el WhatsApp de la marca).
          </p>

          {error && <MensajeError mensaje={error} />}

          <CampoFormulario
            etiqueta="Tu nombre"
            id="cuenta-nombre"
            requerido
            error={erroresCampo.nombre}
          >
            <InputTexto
              id="cuenta-nombre"
              capitalizar="palabras"
              value={formulario.nombre}
              onChange={(e) => cambiar('nombre', e.target.value)}
              required
            />
          </CampoFormulario>

          <CampoFormulario
            etiqueta="Tu correo"
            id="cuenta-correo"
            requerido
            error={erroresCampo.correo}
            ayuda="Si te registraste solo con WhatsApp, pon aquí un correo real para poder recuperar la clave."
          >
            <input
              id="cuenta-correo"
              type="email"
              autoComplete="email"
              value={formulario.correo}
              onChange={(e) => cambiar('correo', e.target.value)}
              placeholder="tu@correo.com"
              required
            />
          </CampoFormulario>

          <h3 className="configuracion-marca__subtitulo">Cambiar contraseña</h3>
          <p className="configuracion-marca__hint">Opcional. Si no quieres cambiarla, déjalos vacíos.</p>

          <CampoFormulario
            etiqueta="Contraseña actual"
            id="cuenta-clave-actual"
            error={erroresCampo.contrasena_actual}
          >
            <CampoContrasena
              id="cuenta-clave-actual"
              value={formulario.contrasenaActual}
              onChange={(e) => cambiar('contrasenaActual', e.target.value)}
              autoComplete="current-password"
              placeholder="Solo si vas a cambiarla"
            />
          </CampoFormulario>

          <CampoFormulario
            etiqueta="Contraseña nueva"
            id="cuenta-clave-nueva"
            error={erroresCampo.contrasena_nueva}
            ayuda="Mínimo 8 caracteres."
          >
            <CampoContrasena
              id="cuenta-clave-nueva"
              value={formulario.contrasenaNueva}
              onChange={(e) => cambiar('contrasenaNueva', e.target.value)}
              autoComplete="new-password"
              minLength={8}
              placeholder="Nueva contraseña"
            />
          </CampoFormulario>

          <CampoFormulario
            etiqueta="Repite la contraseña nueva"
            id="cuenta-clave-nueva-2"
          >
            <CampoContrasena
              id="cuenta-clave-nueva-2"
              value={formulario.contrasenaNueva2}
              onChange={(e) => cambiar('contrasenaNueva2', e.target.value)}
              autoComplete="new-password"
              placeholder="Confirmar"
            />
          </CampoFormulario>

          <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={guardando}>
            {guardando ? 'Guardando cuenta...' : 'Guardar mi cuenta'}
          </BotonPrincipal>
        </form>
      )}
    </AcordeonSeccion>
  );
}
