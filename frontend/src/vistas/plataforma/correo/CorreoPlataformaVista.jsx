import { useEffect, useState } from 'react';
import {
  BotonPrincipal,
  CampoContrasena,
  CampoFormulario,
  Cargando,
  MensajeError,
  ModalGuia,
  ModalMensaje,
} from '../../../compartido/componentes';
import {
  guardarCorreoPlataforma,
  obtenerCorreoPlataforma,
  probarCorreoPlataforma,
} from '../../../modulos/plataforma/servicios/plataformaServicio';
import '../../../estilos/plataforma/correo/correo.css';

const VACIO = {
  host: '',
  puerto: 587,
  seguro: false,
  usuario: '',
  contrasena: '',
  remitente: '',
  celularRecuperacion: '',
  correoPrueba: '',
};

export default function CorreoPlataformaVista() {
  const [estado, setEstado] = useState(null);
  const [formulario, setFormulario] = useState(VACIO);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [probando, setProbando] = useState(false);
  const [error, setError] = useState(null);
  const [erroresCampo, setErroresCampo] = useState({});
  const [modalMensaje, setModalMensaje] = useState(null);
  const [guiaAbierta, setGuiaAbierta] = useState(false);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerCorreoPlataforma();
      setEstado(datos);
      setFormulario({
        host: datos.host || '',
        puerto: datos.puerto || 587,
        seguro: Boolean(datos.seguro),
        usuario: datos.usuario || '',
        contrasena: '',
        remitente: datos.remitente || '',
        celularRecuperacion: datos.celularRecuperacion || '',
        correoPrueba: datos.usuario || '',
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

  function usarGmail() {
    setFormulario((actual) => ({
      ...actual,
      host: 'smtp.gmail.com',
      puerto: 587,
      seguro: false,
    }));
  }

  async function guardar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    setErroresCampo({});
    try {
      const datos = await guardarCorreoPlataforma({
        host: formulario.host,
        puerto: formulario.puerto,
        seguro: formulario.seguro,
        usuario: formulario.usuario,
        contrasena: formulario.contrasena,
        remitente: formulario.remitente,
        celular_recuperacion: formulario.celularRecuperacion,
      });
      setEstado(datos);
      setFormulario((actual) => ({
        ...actual,
        host: datos.host || '',
        puerto: datos.puerto || 587,
        seguro: Boolean(datos.seguro),
        usuario: datos.usuario || '',
        contrasena: '',
        remitente: datos.remitente || '',
        celularRecuperacion: datos.celularRecuperacion || '',
      }));
      setModalMensaje({
        titulo: 'Correo guardado',
        mensaje: datos.listo
          ? 'Ya se pueden enviar recuperaciones de contraseña desde este buzón.'
          : 'Guardado. Completa host, usuario y contraseña de aplicación.',
        variante: 'exito',
      });
    } catch (err) {
      setError(err.message);
      if (err.datos?.errores) setErroresCampo(err.datos.errores);
    } finally {
      setGuardando(false);
    }
  }

  async function probar() {
    setProbando(true);
    setError(null);
    try {
      await probarCorreoPlataforma(formulario.correoPrueba.trim());
      setModalMensaje({
        titulo: 'Prueba enviada',
        mensaje: `Revisa la bandeja de ${formulario.correoPrueba.trim()}.`,
        variante: 'exito',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setProbando(false);
    }
  }

  if (cargando) return <Cargando />;
  if (error && !estado) return <MensajeError mensaje={error} onReintentar={cargar} />;

  return (
    <div className="correo-plataforma">
      <ModalMensaje
        abierto={Boolean(modalMensaje)}
        titulo={modalMensaje?.titulo ?? ''}
        mensaje={modalMensaje?.mensaje}
        variante={modalMensaje?.variante ?? 'exito'}
        onCerrar={() => setModalMensaje(null)}
      />

      <ModalGuia
        abierto={guiaAbierta}
        titulo="Cómo sacar los datos del correo (SMTP)"
        onCerrar={() => setGuiaAbierta(false)}
      >
        <p className="modal-guia__que-es">
          <strong>¿Para qué sirve?</strong>
          Este correo lo usa la plataforma para enviar el enlace de recuperar contraseña
          (superadmin y, si aplica, otros avisos del sistema).
        </p>
        <section className="modal-guia__paso">
          <h3 className="modal-guia__paso-titulo">Gmail (recomendado)</h3>
          <ol>
            <li>Pulsa <strong>Usar Gmail</strong>.</li>
            <li>En Google activa verificación en 2 pasos.</li>
            <li>Crea una contraseña de aplicación y pégala aquí (no la clave normal).</li>
            <li>Guarda el celular de recuperación: es el que pedirás al olvidar la clave.</li>
          </ol>
          <a
            className="modal-guia__enlace"
            href="https://myaccount.google.com/apppasswords"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir contraseñas de aplicaciones
          </a>
        </section>
      </ModalGuia>

      <header className="correo-plataforma__cabecera">
        <div>
          <h1>Correo de la plataforma</h1>
          <p>
            Configura el buzón que envía el enlace de recuperar contraseña.
            No es el correo de cada marca: es el de quien administra la plataforma.
          </p>
        </div>
        <p className={`correo-plataforma__estado${estado?.listo ? ' correo-plataforma__estado--listo' : ''}`}>
          {estado?.listo ? 'Listo para enviar' : 'Todavía no envía'}
        </p>
      </header>

      {estado?.desdeEntorno && (
        <p className="correo-plataforma__aviso">
          Ahora mismo hay valores tomados del servidor (.env). Al guardar aquí, quedan en la base
          y puedes cambiarlos sin tocar el hosting.
        </p>
      )}

      {error && <MensajeError mensaje={error} />}

      <button
        type="button"
        className="correo-plataforma__btn-guia"
        onClick={() => setGuiaAbierta(true)}
      >
        ¿Qué es SMTP y de dónde salen estos datos?
      </button>

      <form className="correo-plataforma__formulario" onSubmit={guardar}>
        <BotonPrincipal type="button" variante="secundario" onClick={usarGmail}>
          Usar Gmail (rellena host y puerto)
        </BotonPrincipal>

        <CampoFormulario etiqueta="Correo que envía" id="plat-smtp-usuario" requerido error={erroresCampo.usuario}>
          <input
            id="plat-smtp-usuario"
            type="email"
            value={formulario.usuario}
            onChange={(e) => cambiar('usuario', e.target.value)}
            placeholder="tu@gmail.com"
            autoComplete="off"
            required
          />
        </CampoFormulario>

        <CampoFormulario
          etiqueta={estado?.contrasenaConfigurada
            ? 'Contraseña de aplicación (vacío = no cambiar)'
            : 'Contraseña de aplicación'}
          id="plat-smtp-pass"
          requerido={!estado?.contrasenaConfigurada}
          error={erroresCampo.contrasena}
        >
          <CampoContrasena
            id="plat-smtp-pass"
            value={formulario.contrasena}
            onChange={(e) => cambiar('contrasena', e.target.value)}
            placeholder={estado?.contrasenaConfigurada
              ? 'Déjala vacía para no cambiarla'
              : 'La de 16 letras de Google'}
            autoComplete="new-password"
            required={!estado?.contrasenaConfigurada}
          />
        </CampoFormulario>

        <CampoFormulario etiqueta="Nombre que se ve en el De:" id="plat-smtp-remitente">
          <input
            id="plat-smtp-remitente"
            value={formulario.remitente}
            onChange={(e) => cambiar('remitente', e.target.value)}
            placeholder="Agenda Plataforma <tu@gmail.com>"
          />
        </CampoFormulario>

        <CampoFormulario
          etiqueta="Celular para recuperar contraseña"
          id="plat-smtp-celular"
          error={erroresCampo.celular_recuperacion}
          ayuda="Al olvidar la clave en /plataforma, pediremos este celular junto con el correo."
        >
          <input
            id="plat-smtp-celular"
            type="tel"
            inputMode="tel"
            value={formulario.celularRecuperacion}
            onChange={(e) => cambiar('celularRecuperacion', e.target.value)}
            placeholder="3001234567"
          />
        </CampoFormulario>

        <details className="correo-plataforma__avanzado">
          <summary>Ajustes avanzados (host y puerto)</summary>
          <CampoFormulario etiqueta="Host SMTP" id="plat-smtp-host" error={erroresCampo.host}>
            <input
              id="plat-smtp-host"
              value={formulario.host}
              onChange={(e) => cambiar('host', e.target.value)}
              placeholder="smtp.gmail.com"
              autoComplete="off"
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Puerto" id="plat-smtp-puerto">
            <input
              id="plat-smtp-puerto"
              type="number"
              inputMode="numeric"
              value={formulario.puerto}
              onChange={(e) => cambiar('puerto', Number(e.target.value) || 587)}
            />
          </CampoFormulario>
          <label className="correo-plataforma__toggle">
            <input
              type="checkbox"
              checked={formulario.seguro}
              onChange={(e) => cambiar('seguro', e.target.checked)}
            />
            <span>Puerto seguro 465 (SSL)</span>
          </label>
        </details>

        <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={guardando}>
          {guardando ? 'Guardando...' : 'Guardar correo'}
        </BotonPrincipal>
      </form>

      <section className="correo-plataforma__prueba">
        <h2>Probar envío</h2>
        <CampoFormulario etiqueta="Correo de prueba" id="plat-smtp-prueba">
          <input
            id="plat-smtp-prueba"
            type="email"
            value={formulario.correoPrueba}
            onChange={(e) => cambiar('correoPrueba', e.target.value)}
            placeholder="El tuyo, para ver si llega"
          />
        </CampoFormulario>
        <BotonPrincipal
          type="button"
          variante="secundario"
          onClick={probar}
          deshabilitado={probando || !estado?.listo}
        >
          {probando ? 'Enviando...' : 'Probar correo'}
        </BotonPrincipal>
      </section>
    </div>
  );
}
