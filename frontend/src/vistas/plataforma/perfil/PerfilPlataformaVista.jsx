import { useEffect, useState } from 'react';
import { useAuthPlataforma } from '../../../aplicacion/proveedores/ProveedorAuth';
import {
  BotonPrincipal,
  CampoContrasena,
  CampoFormulario,
  Cargando,
  InputTexto,
  MensajeError,
  ModalMensaje,
} from '../../../compartido/componentes';
import {
  actualizarPerfilPlataforma,
  obtenerPerfilPlataforma,
} from '../../../modulos/plataforma/servicios/plataformaServicio';
import '../../../estilos/plataforma/perfil/perfil.css';

const VACIO = {
  nombre: '',
  correo: '',
  contrasenaActual: '',
  contrasenaNueva: '',
  contrasenaNueva2: '',
};

export default function PerfilPlataformaVista() {
  const { recargarSesion } = useAuthPlataforma();
  const [formulario, setFormulario] = useState(VACIO);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [erroresCampo, setErroresCampo] = useState({});
  const [modalMensaje, setModalMensaje] = useState(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerPerfilPlataforma();
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

    const cambiaClave = Boolean(formulario.contrasenaNueva.trim() || formulario.contrasenaActual.trim());
    if (cambiaClave && formulario.contrasenaNueva !== formulario.contrasenaNueva2) {
      setErroresCampo({ contrasena_nueva: 'Las contraseñas nuevas no coinciden.' });
      setGuardando(false);
      return;
    }

    try {
      const payload = {
        nombre: formulario.nombre.trim(),
        correo: formulario.correo.trim(),
      };
      if (cambiaClave) {
        payload.contrasena_actual = formulario.contrasenaActual;
        payload.contrasena_nueva = formulario.contrasenaNueva;
      }

      const datos = await actualizarPerfilPlataforma(payload);
      setFormulario({
        ...VACIO,
        nombre: datos.usuario?.nombre ?? '',
        correo: datos.usuario?.correo ?? '',
      });
      await recargarSesion();
      setModalMensaje({
        titulo: 'Perfil guardado',
        mensaje: datos.contrasenaActualizada
          ? 'Datos y contraseña actualizados. Otras sesiones se cerraron.'
          : 'Tus datos de perfil quedaron actualizados.',
        variante: 'exito',
      });
    } catch (err) {
      setError(err.message);
      if (err.datos?.errores) setErroresCampo(err.datos.errores);
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <Cargando />;
  if (error && !formulario.nombre && !formulario.correo) {
    return <MensajeError mensaje={error} onReintentar={cargar} />;
  }

  return (
    <div className="perfil-plataforma">
      <ModalMensaje
        abierto={Boolean(modalMensaje)}
        titulo={modalMensaje?.titulo ?? ''}
        mensaje={modalMensaje?.mensaje}
        variante={modalMensaje?.variante ?? 'exito'}
        onCerrar={() => setModalMensaje(null)}
      />

      <header className="perfil-plataforma__cabecera">
        <h1>Mi perfil</h1>
        <p>
          Datos de la cuenta de administrador de plataforma. Aquí puedes cambiar
          el nombre, el correo y la contraseña.
        </p>
      </header>

      {error && <MensajeError mensaje={error} />}

      <form className="perfil-plataforma__formulario" onSubmit={guardar}>
        <CampoFormulario
          etiqueta="Nombre"
          id="perfil-nombre"
          requerido
          error={erroresCampo.nombre}
        >
          <InputTexto
            id="perfil-nombre"
            capitalizar="palabras"
            value={formulario.nombre}
            onChange={(e) => cambiar('nombre', e.target.value)}
            required
            autoComplete="name"
          />
        </CampoFormulario>

        <CampoFormulario
          etiqueta="Correo"
          id="perfil-correo"
          requerido
          error={erroresCampo.correo}
        >
          <input
            id="perfil-correo"
            type="email"
            value={formulario.correo}
            onChange={(e) => cambiar('correo', e.target.value)}
            required
            autoComplete="username"
          />
        </CampoFormulario>

        <section className="perfil-plataforma__bloque-clave" aria-labelledby="perfil-clave-titulo">
          <h2 id="perfil-clave-titulo">Cambiar contraseña</h2>
          <p className="perfil-plataforma__hint">
            Déjalo vacío si solo quieres actualizar nombre o correo.
            Si cambias la clave, se cierran las otras sesiones abiertas.
          </p>

          <CampoFormulario
            etiqueta="Contraseña actual"
            id="perfil-clave-actual"
            error={erroresCampo.contrasena_actual}
          >
            <CampoContrasena
              id="perfil-clave-actual"
              value={formulario.contrasenaActual}
              onChange={(e) => cambiar('contrasenaActual', e.target.value)}
              autoComplete="current-password"
              placeholder="Solo si vas a cambiarla"
            />
          </CampoFormulario>

          <CampoFormulario
            etiqueta="Contraseña nueva"
            id="perfil-clave-nueva"
            error={erroresCampo.contrasena_nueva}
          >
            <CampoContrasena
              id="perfil-clave-nueva"
              value={formulario.contrasenaNueva}
              onChange={(e) => cambiar('contrasenaNueva', e.target.value)}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
            />
          </CampoFormulario>

          <CampoFormulario
            etiqueta="Repite la contraseña nueva"
            id="perfil-clave-nueva-2"
          >
            <CampoContrasena
              id="perfil-clave-nueva-2"
              value={formulario.contrasenaNueva2}
              onChange={(e) => cambiar('contrasenaNueva2', e.target.value)}
              autoComplete="new-password"
            />
          </CampoFormulario>
        </section>

        <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={guardando}>
          {guardando ? 'Guardando...' : 'Guardar perfil'}
        </BotonPrincipal>
      </form>
    </div>
  );
}
