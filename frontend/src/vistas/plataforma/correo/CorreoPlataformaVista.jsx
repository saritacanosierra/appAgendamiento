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
  host: 'smtp.gmail.com',
  puerto: 587,
  seguro: false,
  usuario: '',
  contrasena: '',
  remitente: 'Agenda <onboarding@resend.dev>',
  celularRecuperacion: '',
  resendApiKey: '',
  correoPrueba: '',
};

function corregirCorreoGmail(valor) {
  const limpio = String(valor ?? '').trim().toLowerCase();
  if (limpio.endsWith('@gmial.com')) {
    return `${limpio.slice(0, -'@gmial.com'.length)}@gmail.com`;
  }
  return String(valor ?? '').trim();
}

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
        host: datos.host || 'smtp.gmail.com',
        puerto: datos.puerto || 587,
        seguro: Boolean(datos.seguro),
        usuario: datos.usuario || '',
        contrasena: '',
        remitente: datos.remitente || 'Agenda <onboarding@resend.dev>',
        celularRecuperacion: datos.celularRecuperacion || '',
        resendApiKey: '',
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

  async function guardar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    setErroresCampo({});
    const usuario = corregirCorreoGmail(formulario.usuario);
    try {
      const datos = await guardarCorreoPlataforma({
        host: formulario.host,
        puerto: formulario.puerto,
        seguro: formulario.seguro,
        usuario,
        contrasena: formulario.contrasena,
        remitente: formulario.remitente,
        celular_recuperacion: formulario.celularRecuperacion,
        resend_api_key: formulario.resendApiKey,
      });
      setEstado(datos);
      setFormulario((actual) => ({
        ...actual,
        host: datos.host || actual.host,
        puerto: datos.puerto || 587,
        seguro: Boolean(datos.seguro),
        usuario: datos.usuario || '',
        contrasena: '',
        remitente: datos.remitente || '',
        celularRecuperacion: datos.celularRecuperacion || '',
        resendApiKey: '',
      }));
      setModalMensaje({
        titulo: 'Correo guardado',
        mensaje: datos.proveedor === 'resend'
          ? 'Listo con Resend. Ya puedes probar el envío (funciona en Render).'
          : (datos.listo
            ? 'Guardado. Si estás en Render y falla la prueba, usa Resend.'
            : 'Guardado. Falta la API key de Resend o el SMTP.'),
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
    const destino = corregirCorreoGmail(formulario.correoPrueba);
    if (!destino || !destino.includes('@')) {
      setError('Escribe un correo de prueba válido (ej. tu@gmail.com).');
      return;
    }
    if (destino !== formulario.correoPrueba) {
      setFormulario((actual) => ({ ...actual, correoPrueba: destino }));
    }
    setProbando(true);
    setError(null);
    const ac = new AbortController();
    const temporizador = setTimeout(() => ac.abort(), 20_000);
    try {
      await probarCorreoPlataforma(destino, { signal: ac.signal });
      setModalMensaje({
        titulo: 'Prueba enviada',
        mensaje: `Revisa la bandeja de ${destino} (y spam).`,
        variante: 'exito',
      });
    } catch (err) {
      const abortado = err?.name === 'AbortError' || ac.signal.aborted;
      const red = /failed to fetch|networkerror|err_failed|cors|bad gateway|502/i.test(
        `${err?.message || ''} ${err?.codigoHttp || ''}`
      );
      setError(
        abortado || red
          ? 'No se pudo enviar. En Render usa Resend (API key), no Gmail SMTP.'
          : (err.message || 'No se pudo enviar la prueba.')
      );
    } finally {
      clearTimeout(temporizador);
      setProbando(false);
    }
  }

  if (cargando) return <Cargando />;
  if (error && !estado) return <MensajeError mensaje={error} onReintentar={cargar} />;

  const etiquetaProveedor = estado?.proveedor === 'resend'
    ? 'Listo con Resend'
    : (estado?.listo ? 'Listo (SMTP)' : 'Todavía no envía');

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
        titulo="Cómo configurar el correo (Resend)"
        onCerrar={() => setGuiaAbierta(false)}
      >
        <p className="modal-guia__que-es">
          <strong>¿Por qué Resend?</strong>
          En Render (donde vive la API) el puerto de Gmail SMTP está cerrado.
          Resend envía por internet normal (HTTPS) y sí funciona.
        </p>
        <section className="modal-guia__paso">
          <h3 className="modal-guia__paso-titulo">Pasos</h3>
          <ol>
            <li>Crea cuenta gratis en resend.com</li>
            <li>API Keys → Create API Key → copia la clave (empieza por re_)</li>
            <li>Pégala aquí, guarda el celular y pulsa Guardar</li>
            <li>Deja el remitente en <strong>Agenda &lt;onboarding@resend.dev&gt;</strong> para pruebas</li>
            <li>La prueba solo llega al correo con el que te registraste en Resend (hasta verificar dominio)</li>
          </ol>
          <a
            className="modal-guia__enlace"
            href="https://resend.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir API Keys de Resend
          </a>
        </section>
      </ModalGuia>

      <header className="correo-plataforma__cabecera">
        <div>
          <h1>Correo de la plataforma</h1>
          <p>
            Sirve para el enlace de recuperar contraseña del superadmin.
            En Render usa Resend; Gmail SMTP no llega.
          </p>
        </div>
        <p className={`correo-plataforma__estado${estado?.listo ? ' correo-plataforma__estado--listo' : ''}`}>
          {etiquetaProveedor}
        </p>
      </header>

      <p className="correo-plataforma__aviso">
        Si ves “tiempo agotado o bloqueado”, no es que falte subir el código:
        Gmail SMTP está cerrado en Render. Pega una API key de Resend abajo.
      </p>

      {error && <MensajeError mensaje={error} />}

      <button
        type="button"
        className="correo-plataforma__btn-guia"
        onClick={() => setGuiaAbierta(true)}
      >
        ¿Cómo saco la API key de Resend?
      </button>

      <form className="correo-plataforma__formulario" onSubmit={guardar}>
        <CampoFormulario
          etiqueta={estado?.resendConfigurado
            ? 'API key de Resend (vacío = no cambiar)'
            : 'API key de Resend'}
          id="plat-resend-key"
          requerido={!estado?.resendConfigurado}
          error={erroresCampo.resend_api_key}
          ayuda="Empieza por re_… La consigues en resend.com → API Keys."
        >
          <CampoContrasena
            id="plat-resend-key"
            value={formulario.resendApiKey}
            onChange={(e) => cambiar('resendApiKey', e.target.value)}
            placeholder={estado?.resendConfigurado
              ? 'Déjala vacía para no cambiarla'
              : 're_xxxxxxxx'}
            autoComplete="new-password"
            required={!estado?.resendConfigurado && !estado?.contrasenaConfigurada}
          />
        </CampoFormulario>

        <CampoFormulario
          etiqueta="Remitente (De:)"
          id="plat-smtp-remitente"
          ayuda="Para pruebas en Resend deja: Agenda <onboarding@resend.dev>"
        >
          <input
            id="plat-smtp-remitente"
            value={formulario.remitente}
            onChange={(e) => cambiar('remitente', e.target.value)}
            placeholder="Agenda <onboarding@resend.dev>"
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

        <CampoFormulario
          etiqueta="Tu correo (referencia)"
          id="plat-smtp-usuario"
          error={erroresCampo.usuario}
          ayuda="El correo del superadmin / el de tu cuenta Resend."
        >
          <input
            id="plat-smtp-usuario"
            type="email"
            value={formulario.usuario}
            onChange={(e) => cambiar('usuario', e.target.value)}
            placeholder="tu@gmail.com"
            autoComplete="off"
          />
        </CampoFormulario>

        <details className="correo-plataforma__avanzado">
          <summary>SMTP Gmail (solo si NO estás en Render)</summary>
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
          <CampoFormulario
            etiqueta={estado?.contrasenaConfigurada
              ? 'Contraseña de aplicación (vacío = no cambiar)'
              : 'Contraseña de aplicación'}
            id="plat-smtp-pass"
            error={erroresCampo.contrasena}
          >
            <CampoContrasena
              id="plat-smtp-pass"
              value={formulario.contrasena}
              onChange={(e) => cambiar('contrasena', e.target.value)}
              placeholder="Solo para VPS/local, no Render"
              autoComplete="new-password"
            />
          </CampoFormulario>
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
            placeholder="El mismo de tu cuenta Resend"
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
