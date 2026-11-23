import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../../aplicacion/proveedores/ProveedorAuth';
import { useAvisos } from '../../../aplicacion/proveedores/ProveedorAvisos';
import { INDICATIVOS_PAIS, RUTAS_ADMIN } from '../../../compartido/constantes';
import {
  BotonPrincipal,
  CampoContrasena,
  CampoFormulario,
  Cargando,
  ImagenAmpliable,
  InputTexto,
  MensajeError,
  ModalGuia,
  ModalMensaje,
  TextareaTexto,
} from '../../../compartido/componentes';
import { aplicarTemaMarca } from '../../../compartido/utilidades/temaMarca';
import { subirImagenAdmin } from '../../../compartido/utilidades/apiCliente';
import {
  actualizarConfiguracionMarca,
  obtenerConfiguracionMarca,
} from '../../../modulos/configuracion_marca/servicios/configuracionServicio';
import {
  desconectarGoogleCalendar,
  iniciarAutorizacionGoogle,
  obtenerEstadoGoogleCalendar,
  probarGoogleCalendar,
  probarCorreoMarca,
  probarWhatsappMarca,
} from '../../../modulos/configuracion_marca/servicios/integracionesServicio';
import { AyudaPasoTienda } from '../../../componentes/admin/guia_personalizacion/GuiaPersonalizacion';
import '../../../estilos/admin/configuracion/configuracion.css';

const DIAS = [
  { id: 'lunes', etiqueta: 'Lunes' },
  { id: 'martes', etiqueta: 'Martes' },
  { id: 'miercoles', etiqueta: 'Miércoles' },
  { id: 'jueves', etiqueta: 'Jueves' },
  { id: 'viernes', etiqueta: 'Viernes' },
  { id: 'sabado', etiqueta: 'Sábado' },
  { id: 'domingo', etiqueta: 'Domingo' },
];

function AcordeonSeccion({
  id,
  titulo,
  resumen = '',
  abierta,
  onAbrir,
  className = '',
  children,
}) {
  return (
    <section
      id={id}
      className={`configuracion-marca__acordeon ${abierta ? 'configuracion-marca__acordeon--abierta' : ''} ${className}`.trim()}
    >
      <button
        type="button"
        className="configuracion-marca__acordeon-cabecera"
        aria-expanded={abierta}
        onClick={() => onAbrir(id)}
      >
        <span className="configuracion-marca__acordeon-textos">
          <span className="configuracion-marca__acordeon-titulo">{titulo}</span>
          {resumen ? (
            <span className="configuracion-marca__acordeon-resumen">{resumen}</span>
          ) : null}
        </span>
        <span className="configuracion-marca__acordeon-accion">
          {abierta ? 'Cerrar' : 'Abrir'}
        </span>
      </button>
      {abierta ? (
        <div className="configuracion-marca__acordeon-cuerpo">
          {children}
        </div>
      ) : null}
    </section>
  );
}

export default function ConfiguracionMarcaVista() {
  const { recargarSesion } = useAuth();
  const navigate = useNavigate();
  const avisos = useAvisos();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hash } = useLocation();
  const [config, setConfig] = useState(null);
  const [googleEstado, setGoogleEstado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [conectandoGoogle, setConectandoGoogle] = useState(false);
  const [probandoGoogle, setProbandoGoogle] = useState(false);
  const [probandoWhatsapp, setProbandoWhatsapp] = useState(false);
  const [probandoCorreo, setProbandoCorreo] = useState(false);
  const [telefonoPruebaWhatsapp, setTelefonoPruebaWhatsapp] = useState('');
  const [correoPrueba, setCorreoPrueba] = useState('');
  const [whatsappTokenNuevo, setWhatsappTokenNuevo] = useState('');
  const [correoSmtpContrasenaNueva, setCorreoSmtpContrasenaNueva] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [error, setError] = useState(null);
  const [modalMensaje, setModalMensaje] = useState(null);
  const [guiaAbierta, setGuiaAbierta] = useState(null);
  const [seccionAbierta, setSeccionAbierta] = useState('identidad');

  function abrirSeccion(id) {
    setSeccionAbierta((actual) => (actual === id ? null : id));
  }

  function aplicarGmailRapido() {
    actualizarCorreoSmtp('host', 'smtp.gmail.com');
    actualizarCorreoSmtp('puerto', 587);
    actualizarCorreoSmtp('seguro', false);
  }

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const [datos, google] = await Promise.all([
        obtenerConfiguracionMarca(),
        obtenerEstadoGoogleCalendar().catch(() => null),
      ]);
      setConfig(datos);
      setGoogleEstado(google);
      aplicarTemaMarca(datos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  useEffect(() => {
    const resultado = searchParams.get('google');
    if (resultado === 'conectado') {
      setModalMensaje({
        titulo: 'Google Calendar conectado',
        mensaje: 'Tu calendario quedó vinculado correctamente.',
        variante: 'exito',
      });
      searchParams.delete('google');
      setSearchParams(searchParams, { replace: true });
      obtenerEstadoGoogleCalendar().then(setGoogleEstado).catch(() => {});
    } else if (resultado === 'error') {
      const motivo = searchParams.get('motivo');
      setError(motivo ? decodeURIComponent(motivo) : 'No se pudo conectar Google Calendar.');
      searchParams.delete('google');
      searchParams.delete('motivo');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (cargando || !config || !hash) return;
    const id = hash.replace(/^#/, '');
    if (!id) return;
    setSeccionAbierta(id);
    const temporizador = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(temporizador);
  }, [cargando, config, hash]);

  function actualizarCampo(campo, valor) {
    setConfig((prev) => {
      const next = { ...prev, [campo]: valor };
      if (['colorPrincipal', 'colorSecundario', 'colorFondo', 'colorTexto'].includes(campo)) {
        aplicarTemaMarca(next);
      }
      return next;
    });
  }

  function actualizarHorario(dia, campo, valor) {
    setConfig((prev) => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [dia]: prev.horarios?.[dia]
          ? { ...prev.horarios[dia], [campo]: valor }
          : { apertura: '10:00', cierre: '19:00', bloqueos: [], [campo]: valor },
      },
    }));
  }

  function agregarBloqueo(dia) {
    setConfig((prev) => {
      const horario = prev.horarios?.[dia] ?? { apertura: '10:00', cierre: '19:00', bloqueos: [] };
      const bloqueos = [...(horario.bloqueos ?? []), { desde: '14:00', hasta: '15:00' }];
      return {
        ...prev,
        horarios: { ...prev.horarios, [dia]: { ...horario, bloqueos } },
      };
    });
  }

  function actualizarBloqueo(dia, indice, campo, valor) {
    setConfig((prev) => {
      const horario = prev.horarios?.[dia];
      if (!horario) return prev;
      const bloqueos = (horario.bloqueos ?? []).map((b, i) =>
        i === indice ? { ...b, [campo]: valor } : b
      );
      return {
        ...prev,
        horarios: { ...prev.horarios, [dia]: { ...horario, bloqueos } },
      };
    });
  }

  function quitarBloqueo(dia, indice) {
    setConfig((prev) => {
      const horario = prev.horarios?.[dia];
      if (!horario) return prev;
      const bloqueos = (horario.bloqueos ?? []).filter((_, i) => i !== indice);
      return {
        ...prev,
        horarios: { ...prev.horarios, [dia]: { ...horario, bloqueos } },
      };
    });
  }

  function toggleDia(dia, activo) {
    setConfig((prev) => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [dia]: activo ? { apertura: '10:00', cierre: '19:00', bloqueos: [] } : null,
      },
    }));
  }

  async function manejarLogo(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setSubiendoLogo(true);
    setError(null);
    try {
      const { ruta } = await subirImagenAdmin('logos', archivo);
      actualizarCampo('logo', ruta);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendoLogo(false);
    }
  }

  async function conectarGoogle() {
    setConectandoGoogle(true);
    setError(null);
    try {
      const { url } = await iniciarAutorizacionGoogle();
      window.location.href = url;
    } catch (err) {
      setError(err.message);
      setConectandoGoogle(false);
    }
  }

  async function desconectarGoogle() {
    setError(null);
    try {
      await desconectarGoogleCalendar();
      setGoogleEstado((prev) => ({ ...prev, conectado: false, conectadoEn: null }));
      setModalMensaje({
        titulo: 'Google Calendar desconectado',
        mensaje: 'Ya no se sincronizarán citas con Google.',
        variante: 'info',
      });
    } catch (err) {
      setError(err.message);
    }
  }

  function actualizarWhatsappApi(campo, valor) {
    setConfig((prev) => ({
      ...prev,
      whatsappApi: {
        ...(prev.whatsappApi ?? {}),
        [campo]: valor,
      },
    }));
  }

  function actualizarNotificaciones(campo, valor) {
    setConfig((prev) => ({
      ...prev,
      notificaciones: {
        ...(prev.notificaciones ?? {}),
        canales: {
          ...(prev.notificaciones?.canales ?? {}),
          [campo]: valor,
        },
        correo: {
          ...(prev.notificaciones?.correo ?? {}),
        },
      },
    }));
  }

  function actualizarCorreoSmtp(campo, valor) {
    setConfig((prev) => ({
      ...prev,
      notificaciones: {
        ...(prev.notificaciones ?? {}),
        canales: {
          ...(prev.notificaciones?.canales ?? {}),
        },
        correo: {
          ...(prev.notificaciones?.correo ?? {}),
          [campo]: valor,
        },
      },
    }));
  }

  async function probarWhatsapp() {
    if (!telefonoPruebaWhatsapp.trim()) {
      setError('Indica un teléfono para la prueba de WhatsApp.');
      return;
    }
    setProbandoWhatsapp(true);
    setError(null);
    try {
      await probarWhatsappMarca(telefonoPruebaWhatsapp.replace(/\D+/g, ''));
      setModalMensaje({
        titulo: 'WhatsApp de prueba enviado',
        mensaje: 'Revisa el teléfono indicado. El mensaje sale desde el número de esta marca.',
        variante: 'exito',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setProbandoWhatsapp(false);
    }
  }

  async function probarCorreo() {
    if (!correoPrueba.trim()) {
      setError('Indica un correo para la prueba.');
      return;
    }
    setProbandoCorreo(true);
    setError(null);
    try {
      await probarCorreoMarca(correoPrueba.trim());
      setModalMensaje({
        titulo: 'Correo de prueba enviado',
        mensaje: 'Revisa la bandeja del correo indicado. Sale desde el buzón SMTP de esta marca.',
        variante: 'exito',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setProbandoCorreo(false);
    }
  }

  async function probarGoogle() {
    setProbandoGoogle(true);
    setError(null);
    try {
      const datos = await probarGoogleCalendar();
      setModalMensaje({
        titulo: 'Sincronización correcta',
        mensaje: 'Se creó un evento de prueba en Google Calendar.',
        variante: 'exito',
      });
      if (datos?.htmlLink) {
        window.open(datos.htmlLink, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setProbandoGoogle(false);
    }
  }

  async function manejarGuardar(e, destino) {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    const payload = {
      nombre_comercial: config.nombreComercial,
      color_principal: config.colorPrincipal,
      color_secundario: config.colorSecundario,
      color_fondo: config.colorFondo,
      color_texto: config.colorTexto,
      tipografia: config.tipografia,
      logo: config.logo,
      descripcion: config.descripcion,
      telefono: config.telefono,
      whatsapp: config.whatsapp,
      direccion: config.direccion,
      ciudad: config.ciudad,
      horarios: config.horarios,
      whatsapp_api_habilitado: config.whatsappApi?.habilitado ?? false,
      whatsapp_phone_number_id: config.whatsappApi?.phoneNumberId ?? '',
      whatsapp_codigo_pais: config.whatsappApi?.codigoPais ?? '',
      whatsapp_plantilla_recordatorio: config.whatsappApi?.plantillaRecordatorio ?? '',
      whatsapp_plantilla_idioma: config.whatsappApi?.plantillaIdioma ?? 'es_MX',
      whatsapp_plantilla_confirmacion: config.whatsappApi?.plantillaConfirmacion ?? '',
      notificaciones_whatsapp: config.notificaciones?.canales?.whatsapp ?? false,
      notificaciones_correo: config.notificaciones?.canales?.correo ?? false,
      correo_smtp_host: config.notificaciones?.correo?.host ?? '',
      correo_smtp_puerto: config.notificaciones?.correo?.puerto ?? 587,
      correo_smtp_seguro: config.notificaciones?.correo?.seguro ?? false,
      correo_smtp_usuario: config.notificaciones?.correo?.usuario ?? '',
      correo_smtp_remitente: config.notificaciones?.correo?.remitente ?? '',
      correo_smtp_modo: config.notificaciones?.correo?.modoPlantilla ?? 'texto',
      correo_asunto: config.notificaciones?.correo?.asunto ?? '',
      correo_cuerpo_texto: config.notificaciones?.correo?.cuerpoTexto ?? '',
      correo_cuerpo_html: config.notificaciones?.correo?.cuerpoHtml ?? '',
      premio_puntos_necesarios: config.premioPuntos?.puntosNecesarios ?? '',
      premio_porcentaje: config.premioPuntos?.porcentaje ?? '',
    };

    if (whatsappTokenNuevo.trim()) {
      payload.whatsapp_token = whatsappTokenNuevo.trim();
    }
    if (correoSmtpContrasenaNueva.trim()) {
      payload.correo_smtp_contrasena = correoSmtpContrasenaNueva.trim();
    }

    try {
      const actualizada = await actualizarConfiguracionMarca(payload);
      setConfig(actualizada);
      setWhatsappTokenNuevo('');
      setCorreoSmtpContrasenaNueva('');
      await recargarSesion();
      aplicarTemaMarca(actualizada);
      avisos.exito('Configuración guardada. La dirección y el resto de tu marca siguen ahí.');
      if (destino) navigate(destino);
    } catch (err) {
      setModalMensaje({
        titulo: 'No se pudo guardar',
        mensaje: err.message,
        variante: 'error',
      });
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) return <Cargando />;
  if (error && !config) return <MensajeError mensaje={error} onReintentar={cargar} />;
  if (!config) return null;

  return (
    <div className="configuracion-marca">
      <ModalMensaje
        abierto={Boolean(modalMensaje)}
        titulo={modalMensaje?.titulo ?? ''}
        mensaje={modalMensaje?.mensaje}
        variante={modalMensaje?.variante ?? 'exito'}
        onCerrar={() => setModalMensaje(null)}
      />

      <ModalGuia
        abierto={guiaAbierta === 'whatsapp'}
        titulo="Cómo sacar los datos de WhatsApp"
        onCerrar={() => setGuiaAbierta(null)}
      >
        <p className="modal-guia__que-es">
          <strong>¿Para qué sirve?</strong>
          Esto no es el número público de Contacto (wa.me). Es la API de Meta
          para que la agenda envíe sola el mensaje de confirmación al celular de la clienta.
        </p>
        <section className="modal-guia__paso">
          <h3 className="modal-guia__paso-titulo">1. Ten una cuenta Business de Meta</h3>
          <ol>
            <li>Entra a Meta Business Suite o WhatsApp Manager con la cuenta del negocio.</li>
            <li>Activa WhatsApp Business Platform (API) para ese número.</li>
          </ol>
          <a
            className="modal-guia__enlace"
            href="https://business.facebook.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir Meta Business
          </a>
        </section>
        <section className="modal-guia__paso">
          <h3 className="modal-guia__paso-titulo">2. Copia el Phone Number ID</h3>
          <ol>
            <li>En WhatsApp Manager abre el número que vas a usar.</li>
            <li>Busca el campo <strong>Phone number ID</strong> (o ID del número).</li>
            <li>Cópialo completo: es un número largo, no el celular 300…</li>
          </ol>
          <p className="modal-guia__dato">
            Ejemplo de cómo se ve: <code>123456789012345</code>
          </p>
        </section>
        <section className="modal-guia__paso">
          <h3 className="modal-guia__paso-titulo">3. Genera el token</h3>
          <ol>
            <li>Entra a Meta for Developers → tu app → WhatsApp → API Setup.</li>
            <li>Crea un token de acceso (mejor permanente / de sistema).</li>
            <li>Pégalo en el campo Token de esta pantalla y guárdalo.</li>
          </ol>
          <a
            className="modal-guia__enlace"
            href="https://developers.facebook.com/apps/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir Meta Developers
          </a>
        </section>
        <section className="modal-guia__paso">
          <h3 className="modal-guia__paso-titulo">4. País y prueba</h3>
          <ul>
            <li>Elige el país del número de WhatsApp Business.</li>
            <li>Guarda la configuración.</li>
            <li>Escribe tu celular y pulsa Probar WhatsApp.</li>
          </ul>
        </section>
      </ModalGuia>

      <ModalGuia
        abierto={guiaAbierta === 'correo'}
        titulo="Cómo sacar los datos del correo (SMTP)"
        onCerrar={() => setGuiaAbierta(null)}
      >
        <p className="modal-guia__que-es">
          <strong>¿Qué es SMTP?</strong>
          Es el “servicio de envío” de tu correo. La agenda no tiene buzón propio:
          usa tu Gmail (u otro) para mandar el aviso de la cita. Los datos los da
          tu proveedor de correo, no esta app.
        </p>
        <section className="modal-guia__paso">
          <h3 className="modal-guia__paso-titulo">Si usas Gmail (recomendado)</h3>
          <ol>
            <li>Pulsa <strong>Usar Gmail</strong> en esta pantalla (rellena host y puerto).</li>
            <li>
              En Google activa la verificación en 2 pasos:
              Cuenta Google → Seguridad.
            </li>
            <li>
              Crea una <strong>contraseña de aplicación</strong>
              (Seguridad → Contraseñas de aplicaciones → Correo / Otro).
            </li>
            <li>Google te da 16 letras. Esa es la “Contraseña SMTP”, no tu clave normal.</li>
            <li>En Usuario pon tu Gmail. En Remitente: Nombre &lt;tu@gmail.com&gt;.</li>
            <li>Guarda y prueba enviándote un correo.</li>
          </ol>
          <a
            className="modal-guia__enlace"
            href="https://myaccount.google.com/apppasswords"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir contraseñas de aplicaciones de Google
          </a>
          <p className="modal-guia__dato">
            Host: <code>smtp.gmail.com</code>
            {' · '}
            Puerto: <code>587</code>
            {' · '}
            SSL 465: apagado
          </p>
        </section>
        <section className="modal-guia__paso">
          <h3 className="modal-guia__paso-titulo">Qué va en cada campo</h3>
          <ul>
            <li><strong>Host SMTP:</strong> dirección del servidor de envío (Gmail: smtp.gmail.com).</li>
            <li><strong>Puerto:</strong> casi siempre 587; algunos usan 465 con SSL.</li>
            <li><strong>Usuario:</strong> tu dirección de correo completa.</li>
            <li><strong>Contraseña SMTP:</strong> en Gmail, la de aplicación de 16 letras.</li>
            <li><strong>Remitente:</strong> el nombre que verá la clienta en el “De:”.</li>
          </ul>
        </section>
        <section className="modal-guia__paso">
          <h3 className="modal-guia__paso-titulo">Si no es Gmail</h3>
          <p>
            Host y puerto te los da tu hosting o Outlook/Hotmail.
            Busca “configuración SMTP” en su ayuda y pégalos en Ajustes avanzados.
          </p>
        </section>
      </ModalGuia>

      <AyudaPasoTienda paso="marca" />
      <h1>Mi marca — perfil e identidad</h1>
      <p className="configuracion-marca__intro">
        Solo se abre una sección a la vez. Pulsa <strong>Abrir</strong> en la que necesites.
        Para las fotos del inicio, usa Carrusel en el menú.
      </p>

      {error && <MensajeError mensaje={error} />}

      <form className="configuracion-marca__formulario" onSubmit={manejarGuardar}>
        <AcordeonSeccion
          id="identidad"
          titulo="1. Identidad"
          resumen="Nombre, descripción y logo"
          abierta={seccionAbierta === 'identidad'}
          onAbrir={abrirSeccion}
        >
          <CampoFormulario etiqueta="Nombre comercial" id="cfg-nombre" requerido>
            <InputTexto
              id="cfg-nombre"
              capitalizar="palabras"
              value={config.nombreComercial}
              onChange={(e) => actualizarCampo('nombreComercial', e.target.value)}
              required
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Descripcion" id="cfg-desc">
            <TextareaTexto
              id="cfg-desc"
              value={config.descripcion ?? ''}
              onChange={(e) => actualizarCampo('descripcion', e.target.value)}
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Logo" id="cfg-logo">
            <input id="cfg-logo" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,.jpg,.jpeg,.png,.webp,.gif,.svg" onChange={manejarLogo} />
            <p className="configuracion-marca__hint">JPG, PNG, WEBP, GIF o SVG. Maximo 5 MB.</p>
            {subiendoLogo && <p className="configuracion-marca__hint">Subiendo logo...</p>}
            {config.logo && (
              <ImagenAmpliable src={config.logo} alt="Logo de la marca" className="configuracion-marca__logo" />
            )}
          </CampoFormulario>
        </AcordeonSeccion>

        <AcordeonSeccion
          id="colores"
          titulo="2. Colores"
          resumen="Principal, fondo y texto"
          abierta={seccionAbierta === 'colores'}
          onAbrir={abrirSeccion}
        >
          <div className="configuracion-marca__colores">
            {[
              ['colorPrincipal', 'Principal'],
              ['colorSecundario', 'Secundario'],
              ['colorFondo', 'Fondo'],
              ['colorTexto', 'Texto'],
            ].map(([campo, etiqueta]) => (
              <CampoFormulario key={campo} etiqueta={etiqueta} id={`cfg-${campo}`}>
                <input
                  id={`cfg-${campo}`}
                  type="color"
                  value={config[campo]}
                  onChange={(e) => actualizarCampo(campo, e.target.value)}
                />
              </CampoFormulario>
            ))}
          </div>
        </AcordeonSeccion>

        <AcordeonSeccion
          id="contacto"
          titulo="3. Contacto"
          resumen="Teléfono, WhatsApp público y dirección"
          abierta={seccionAbierta === 'contacto'}
          onAbrir={abrirSeccion}
        >
          <CampoFormulario etiqueta="Telefono" id="cfg-tel">
            <input
              id="cfg-tel"
              value={config.telefono ?? ''}
              onChange={(e) => actualizarCampo('telefono', e.target.value)}
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="WhatsApp" id="cfg-wa">
            <input
              id="cfg-wa"
              value={config.whatsapp ?? ''}
              onChange={(e) => actualizarCampo('whatsapp', e.target.value)}
              placeholder="Numero publico visible en la web"
            />
            <p className="configuracion-marca__hint">
              Con este numero las clientas pueden escribirte por WhatsApp (enlace wa.me) sin configurar token de Meta.
              El enlace usa el indicativo que elijas abajo. Si no corresponde al pais del numero, WhatsApp dice que no existe.
              Para mensajes automaticos al reservar o recordatorios, usa la seccion de abajo.
            </p>
          </CampoFormulario>
          <CampoFormulario etiqueta="Direccion" id="cfg-dir">
            <InputTexto
              id="cfg-dir"
              value={config.direccion ?? ''}
              onChange={(e) => actualizarCampo('direccion', e.target.value)}
            />
          </CampoFormulario>
          <CampoFormulario
            etiqueta="Ciudad"
            id="cfg-ciudad"
            ayuda="Aparece en el titulo de Google: Citas de Unas en esta ciudad."
          >
            <InputTexto
              id="cfg-ciudad"
              capitalizar="palabras"
              value={config.ciudad ?? ''}
              onChange={(e) => actualizarCampo('ciudad', e.target.value)}
              placeholder="Bogota"
            />
          </CampoFormulario>
        </AcordeonSeccion>

        <AcordeonSeccion
          id="equipo"
          titulo="4. Equipo"
          resumen="Guardar y pasar a profesionales"
          abierta={seccionAbierta === 'equipo'}
          onAbrir={abrirSeccion}
        >
          <p className="configuracion-marca__hint">
            Primero se guarda la dirección y el resto de esta pantalla. Después sigues con las profesionales.
          </p>
          <BotonPrincipal
            type="button"
            anchoCompleto
            deshabilitado={enviando}
            onClick={(e) => manejarGuardar(e, RUTAS_ADMIN.equipo)}
          >
            {enviando ? 'Guardando...' : 'Guardar y seguir con las profesionales →'}
          </BotonPrincipal>
        </AcordeonSeccion>

        <AcordeonSeccion
          id="horarios"
          titulo="5. Horarios"
          resumen="Días, apertura, cierre y descansos"
          abierta={seccionAbierta === 'horarios'}
          onAbrir={abrirSeccion}
          className="configuracion-marca__acordeon--horarios"
        >
          <p className="configuracion-marca__hint configuracion-marca__hint--bloque">
            Activa los días que atiendes y define apertura, cierre y descansos (ej. comida).
          </p>

          <div className="configuracion-marca__horarios">
            {DIAS.map(({ id: dia, etiqueta }) => {
              const horario = config.horarios?.[dia];
              const activo = Boolean(horario);
              const bloqueos = horario?.bloqueos ?? [];

              return (
                <article
                  key={dia}
                  className={`configuracion-marca__horario-dia ${activo ? 'configuracion-marca__horario-dia--activo' : ''}`}
                >
                  <div className="configuracion-marca__horario-cabecera">
                    <label className="configuracion-marca__horario-toggle">
                      <input
                        type="checkbox"
                        checked={activo}
                        onChange={(e) => toggleDia(dia, e.target.checked)}
                      />
                      <span className="configuracion-marca__horario-switch" aria-hidden="true" />
                      <span className="configuracion-marca__horario-nombre">{etiqueta}</span>
                    </label>

                    {!activo ? (
                      <span className="configuracion-marca__horario-cerrado">Cerrado</span>
                    ) : (
                      <div className="configuracion-marca__horario-rango">
                        <label className="configuracion-marca__hora-campo">
                          <span>Abre</span>
                          <input
                            type="time"
                            value={horario.apertura ?? '10:00'}
                            onChange={(e) => actualizarHorario(dia, 'apertura', e.target.value)}
                          />
                        </label>
                        <span className="configuracion-marca__hora-sep" aria-hidden="true">—</span>
                        <label className="configuracion-marca__hora-campo">
                          <span>Cierra</span>
                          <input
                            type="time"
                            value={horario.cierre ?? '19:00'}
                            onChange={(e) => actualizarHorario(dia, 'cierre', e.target.value)}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {activo && (
                    <div className="configuracion-marca__descansos">
                      <div className="configuracion-marca__descansos-cabecera">
                        <span>Descansos</span>
                        {bloqueos.length === 0 && (
                          <span className="configuracion-marca__descansos-vacio">Sin pausas</span>
                        )}
                      </div>

                      {bloqueos.length > 0 && (
                        <ul className="configuracion-marca__descansos-lista">
                          {bloqueos.map((bloqueo, indice) => (
                            <li key={indice} className="configuracion-marca__descanso-item">
                              <div className="configuracion-marca__descanso-horas">
                                <input
                                  type="time"
                                  value={bloqueo.desde ?? '14:00'}
                                  onChange={(e) => actualizarBloqueo(dia, indice, 'desde', e.target.value)}
                                  aria-label={`Inicio descanso ${etiqueta}`}
                                />
                                <span aria-hidden="true">—</span>
                                <input
                                  type="time"
                                  value={bloqueo.hasta ?? '15:00'}
                                  onChange={(e) => actualizarBloqueo(dia, indice, 'hasta', e.target.value)}
                                  aria-label={`Fin descanso ${etiqueta}`}
                                />
                              </div>
                              <button
                                type="button"
                                className="configuracion-marca__descanso-quitar"
                                onClick={() => quitarBloqueo(dia, indice)}
                              >
                                Quitar
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      <button
                        type="button"
                        className="configuracion-marca__descanso-agregar"
                        onClick={() => agregarBloqueo(dia)}
                      >
                        + Agregar descanso
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </AcordeonSeccion>

        <AcordeonSeccion
          id="google-calendar"
          titulo="6. Google Calendar"
          resumen="Opcional: sincronizar citas"
          abierta={seccionAbierta === 'google-calendar'}
          onAbrir={abrirSeccion}
          className="configuracion-marca__acordeon--destacada"
        >
          <p className="configuracion-marca__hint">
            No pegas un enlace manual: autorizas la cuenta de Google de tu empresa y las citas nuevas
            se registran solas en ese calendario.
          </p>
          {!googleEstado?.disponible ? (
            <div className="configuracion-marca__google-pendiente">
              <p className="configuracion-marca__hint">
                {googleEstado?.mensajePlataforma
                  ?? 'La sincronizacion con Google Calendar aun no esta activa para tu cuenta.'}
              </p>
              <p className="configuracion-marca__hint">
                Cuando este disponible, pulsa <strong>Conectar Google Calendar</strong>, inicia sesion
                con la cuenta de Google de tu negocio y cada cita nueva se guardara sola en ese calendario.
              </p>
            </div>
          ) : googleEstado.conectado ? (
            <>
              <p className="configuracion-marca__google-ok">
                Conectado — las nuevas citas se sincronizan automaticamente.
              </p>
              {googleEstado.conectadoEn && (
                <p className="configuracion-marca__hint">
                  Desde {new Date(googleEstado.conectadoEn).toLocaleString('es-MX')}
                </p>
              )}
              <div className="configuracion-marca__google-acciones">
                <BotonPrincipal
                  type="button"
                  variante="secundario"
                  onClick={probarGoogle}
                  deshabilitado={probandoGoogle}
                >
                  {probandoGoogle ? 'Probando...' : 'Probar sincronizacion'}
                </BotonPrincipal>
                <BotonPrincipal variante="secundario" type="button" onClick={desconectarGoogle}>
                  Desconectar
                </BotonPrincipal>
              </div>
            </>
          ) : (
            <>
              <p className="configuracion-marca__hint">
                Pulsa el boton y autoriza con la cuenta de Google de tu negocio (Gmail o Workspace).
              </p>
              <BotonPrincipal
                type="button"
                onClick={conectarGoogle}
                deshabilitado={conectandoGoogle}
              >
                {conectandoGoogle ? 'Redirigiendo...' : 'Conectar Google Calendar'}
              </BotonPrincipal>
            </>
          )}
        </AcordeonSeccion>

        <AcordeonSeccion
          id="premio-puntos"
          titulo="7. Premio por puntos"
          resumen="Opcional: descuento por fidelidad"
          abierta={seccionAbierta === 'premio-puntos'}
          onAbrir={abrirSeccion}
        >
          <p className="configuracion-marca__hint">
            Cada servicio completado suma 10 puntos. Cuando la clienta llega a esta cantidad, la próxima cita tiene el descuento. Al marcar el premio como entregado, el conteo para el siguiente empieza de nuevo. El total de puntos de todos sus servicios se queda.
          </p>
          <CampoFormulario etiqueta="Puntos para el premio" id="cfg-premio-puntos">
            <input
              id="cfg-premio-puntos"
              type="number"
              min="1"
              inputMode="numeric"
              value={config.premioPuntos?.puntosNecesarios ?? ''}
              onChange={(e) => setConfig({
                ...config,
                premioPuntos: {
                  ...config.premioPuntos,
                  puntosNecesarios: e.target.value,
                },
              })}
              placeholder="Por ejemplo, 100"
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Porcentaje de descuento" id="cfg-premio-porcentaje">
            <input
              id="cfg-premio-porcentaje"
              type="number"
              min="1"
              max="100"
              inputMode="numeric"
              value={config.premioPuntos?.porcentaje ?? ''}
              onChange={(e) => setConfig({
                ...config,
                premioPuntos: {
                  ...config.premioPuntos,
                  porcentaje: e.target.value,
                },
              })}
              placeholder="Por ejemplo, 15"
            />
          </CampoFormulario>
        </AcordeonSeccion>

        <AcordeonSeccion
          id="confirmacion-citas"
          titulo="8. Avisos al reservar"
          resumen="WhatsApp automático y/o correo"
          abierta={seccionAbierta === 'confirmacion-citas'}
          onAbrir={abrirSeccion}
        >
          <p className="configuracion-marca__paso-intro">
            Cuando una clienta reserva, puedes avisarle por WhatsApp, por correo, o por los dos.
            Si el aviso no sale, la cita igual queda guardada.
          </p>

          <div className="configuracion-marca__canal">
            <div className="configuracion-marca__canal-cabecera">
              <div>
                <h3>WhatsApp automático</h3>
                <p>Mensaje al celular de la clienta (necesitas cuenta Business de Meta).</p>
              </div>
              <label className="configuracion-marca__horario-toggle configuracion-marca__whatsapp-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(config.notificaciones?.canales?.whatsapp)}
                  onChange={(e) => {
                    const activo = e.target.checked;
                    actualizarNotificaciones('whatsapp', activo);
                    actualizarWhatsappApi('habilitado', activo);
                  }}
                />
                <span className="configuracion-marca__horario-switch" aria-hidden="true" />
                <span>{config.notificaciones?.canales?.whatsapp ? 'Encendido' : 'Apagado'}</span>
              </label>
            </div>

            <button
              type="button"
              className="configuracion-marca__btn-guia"
              onClick={() => setGuiaAbierta('whatsapp')}
            >
              ¿De dónde salen estos datos?
            </button>

            {config.notificaciones?.canales?.whatsapp ? (
              <div className="configuracion-marca__pasos">
                <ol className="configuracion-marca__pasos-lista">
                  <li>En Meta Business / WhatsApp Manager copia el <strong>Phone Number ID</strong>.</li>
                  <li>En Meta Developers genera un <strong>token</strong> permanente.</li>
                  <li>Pégalos abajo, elige el país, guarda y prueba con tu celular.</li>
                </ol>

                <CampoFormulario
                  etiqueta="1. Phone Number ID"
                  id="cfg-wa-phone-id"
                  ayuda="Es un número largo de Meta. No es el celular de tu negocio."
                >
                  <input
                    id="cfg-wa-phone-id"
                    value={config.whatsappApi?.phoneNumberId ?? ''}
                    onChange={(e) => actualizarWhatsappApi('phoneNumberId', e.target.value)}
                    placeholder="Ejemplo: 123456789012345"
                  />
                </CampoFormulario>

                <CampoFormulario
                  etiqueta={config.whatsappApi?.tokenConfigurado
                    ? '2. Token (déjalo vacío si no lo cambias)'
                    : '2. Token de Meta'}
                  id="cfg-wa-token"
                >
                  <CampoContrasena
                    id="cfg-wa-token"
                    value={whatsappTokenNuevo}
                    onChange={(e) => setWhatsappTokenNuevo(e.target.value)}
                    placeholder={config.whatsappApi?.tokenConfigurado
                      ? 'Déjalo vacío para no cambiarlo'
                      : 'Pega aquí el token'}
                    autoComplete="new-password"
                  />
                </CampoFormulario>

                <CampoFormulario etiqueta="3. País del número" id="cfg-wa-pais">
                  <select
                    id="cfg-wa-pais"
                    value={config.whatsappApi?.codigoPais ?? ''}
                    onChange={(e) => actualizarWhatsappApi('codigoPais', e.target.value)}
                  >
                    <option value="">Elige el país</option>
                    {INDICATIVOS_PAIS.map((pais) => (
                      <option key={pais.codigo} value={pais.codigo}>
                        {pais.nombre} +{pais.codigo}
                      </option>
                    ))}
                    {config.whatsappApi?.codigoPais
                      && !INDICATIVOS_PAIS.some((pais) => pais.codigo === config.whatsappApi.codigoPais) && (
                      <option value={config.whatsappApi.codigoPais}>
                        +{config.whatsappApi.codigoPais}
                      </option>
                    )}
                  </select>
                </CampoFormulario>

                <details className="configuracion-marca__guia">
                  <summary>Texto del mensaje (opcional)</summary>
                  <CampoFormulario
                    etiqueta="Mensaje de confirmación"
                    id="cfg-wa-confirmacion"
                    ayuda="Puedes usar {{nombre}}, {{marca}}, {{servicio}}, {{fecha}}, {{hora}}, {{codigo}}, {{url_confirmacion}}"
                  >
                    <TextareaTexto
                      id="cfg-wa-confirmacion"
                      value={config.whatsappApi?.plantillaConfirmacion ?? ''}
                      onChange={(e) => actualizarWhatsappApi('plantillaConfirmacion', e.target.value)}
                      rows={4}
                    />
                  </CampoFormulario>
                  <CampoFormulario etiqueta="Plantilla recordatorio Meta (opcional)" id="cfg-wa-plantilla">
                    <input
                      id="cfg-wa-plantilla"
                      value={config.whatsappApi?.plantillaRecordatorio ?? ''}
                      onChange={(e) => actualizarWhatsappApi('plantillaRecordatorio', e.target.value)}
                      placeholder="recordatorio_cita"
                    />
                  </CampoFormulario>
                </details>

                {config.whatsappApi?.configurado ? (
                  <p className="configuracion-marca__google-ok">
                    Listo. Los avisos saldrán al WhatsApp de la clienta.
                  </p>
                ) : (
                  <p className="configuracion-marca__aviso-falta">
                    Falta guardar el ID, el token y el país. Luego pulsa Guardar y prueba.
                  </p>
                )}

                <div className="configuracion-marca__prueba">
                  <CampoFormulario etiqueta="Tu celular para probar" id="cfg-wa-prueba">
                    <input
                      id="cfg-wa-prueba"
                      value={telefonoPruebaWhatsapp}
                      onChange={(e) => setTelefonoPruebaWhatsapp(e.target.value)}
                      placeholder="Ejemplo: 3001234567"
                    />
                  </CampoFormulario>
                  <BotonPrincipal
                    type="button"
                    variante="secundario"
                    onClick={probarWhatsapp}
                    deshabilitado={probandoWhatsapp || !config.whatsappApi?.configurado}
                  >
                    {probandoWhatsapp ? 'Enviando...' : 'Probar WhatsApp'}
                  </BotonPrincipal>
                </div>
              </div>
            ) : (
              <p className="configuracion-marca__hint">
                Déjalo apagado si solo quieres el número público de Contacto (wa.me). Enciéndelo solo si ya tienes Meta Business API.
              </p>
            )}
          </div>

          <div className="configuracion-marca__canal">
            <div className="configuracion-marca__canal-cabecera">
              <div>
                <h3>Correo automático</h3>
                <p>Sale gratis desde tu propio Gmail u otro correo.</p>
              </div>
              <label className="configuracion-marca__horario-toggle configuracion-marca__whatsapp-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(config.notificaciones?.canales?.correo)}
                  onChange={(e) => actualizarNotificaciones('correo', e.target.checked)}
                />
                <span className="configuracion-marca__horario-switch" aria-hidden="true" />
                <span>{config.notificaciones?.canales?.correo ? 'Encendido' : 'Apagado'}</span>
              </label>
            </div>

            <button
              type="button"
              className="configuracion-marca__btn-guia"
              onClick={() => setGuiaAbierta('correo')}
            >
              ¿Qué es SMTP y de dónde salen estos datos?
            </button>

            {config.notificaciones?.canales?.correo ? (
              <div className="configuracion-marca__pasos">
                <ol className="configuracion-marca__pasos-lista">
                  <li>Si usas Gmail, pulsa <strong>Usar Gmail</strong> y crea una contraseña de aplicación en Google.</li>
                  <li>Escribe tu correo y esa contraseña (no la normal de Gmail).</li>
                  <li>Guarda y prueba enviándote un mensaje.</li>
                </ol>

                <BotonPrincipal type="button" variante="secundario" onClick={aplicarGmailRapido}>
                  Usar Gmail (rellena host y puerto)
                </BotonPrincipal>

                <CampoFormulario etiqueta="1. Correo que envía" id="cfg-smtp-usuario">
                  <input
                    id="cfg-smtp-usuario"
                    value={config.notificaciones?.correo?.usuario ?? ''}
                    onChange={(e) => actualizarCorreoSmtp('usuario', e.target.value)}
                    placeholder="tunegocio@gmail.com"
                    autoComplete="off"
                  />
                </CampoFormulario>

                <CampoFormulario
                  etiqueta={config.notificaciones?.correo?.contrasenaConfigurada
                    ? '2. Contraseña de aplicación (vacío = no cambiar)'
                    : '2. Contraseña de aplicación'}
                  id="cfg-smtp-pass"
                  ayuda="En Gmail: Cuenta Google → Seguridad → Contraseñas de aplicaciones."
                >
                  <CampoContrasena
                    id="cfg-smtp-pass"
                    value={correoSmtpContrasenaNueva}
                    onChange={(e) => setCorreoSmtpContrasenaNueva(e.target.value)}
                    placeholder={config.notificaciones?.correo?.contrasenaConfigurada
                      ? 'Déjala vacía para no cambiarla'
                      : 'La de 16 letras de Google'}
                    autoComplete="new-password"
                  />
                </CampoFormulario>

                <CampoFormulario etiqueta="3. Nombre que verá la clienta" id="cfg-smtp-remitente">
                  <input
                    id="cfg-smtp-remitente"
                    value={config.notificaciones?.correo?.remitente ?? ''}
                    onChange={(e) => actualizarCorreoSmtp('remitente', e.target.value)}
                    placeholder="Beauty Nails <tunegocio@gmail.com>"
                  />
                </CampoFormulario>

                <details className="configuracion-marca__guia">
                  <summary>Ajustes avanzados (solo si no es Gmail)</summary>
                  <CampoFormulario etiqueta="Host SMTP" id="cfg-smtp-host">
                    <input
                      id="cfg-smtp-host"
                      value={config.notificaciones?.correo?.host ?? ''}
                      onChange={(e) => actualizarCorreoSmtp('host', e.target.value)}
                      placeholder="smtp.gmail.com"
                      autoComplete="off"
                    />
                  </CampoFormulario>
                  <CampoFormulario etiqueta="Puerto" id="cfg-smtp-puerto">
                    <input
                      id="cfg-smtp-puerto"
                      type="number"
                      inputMode="numeric"
                      value={config.notificaciones?.correo?.puerto ?? 587}
                      onChange={(e) => actualizarCorreoSmtp('puerto', Number(e.target.value) || 587)}
                      placeholder="587"
                    />
                  </CampoFormulario>
                  <label className="configuracion-marca__horario-toggle configuracion-marca__whatsapp-toggle">
                    <input
                      type="checkbox"
                      checked={Boolean(config.notificaciones?.correo?.seguro)}
                      onChange={(e) => actualizarCorreoSmtp('seguro', e.target.checked)}
                    />
                    <span className="configuracion-marca__horario-switch" aria-hidden="true" />
                    <span>Puerto seguro 465 (SSL)</span>
                  </label>
                  <CampoFormulario etiqueta="Asunto" id="cfg-smtp-asunto">
                    <input
                      id="cfg-smtp-asunto"
                      value={config.notificaciones?.correo?.asunto ?? ''}
                      onChange={(e) => actualizarCorreoSmtp('asunto', e.target.value)}
                      placeholder="Confirmacion de cita — {{marca}}"
                    />
                  </CampoFormulario>
                  <CampoFormulario etiqueta="Tipo de mensaje" id="cfg-smtp-modo">
                    <select
                      id="cfg-smtp-modo"
                      value={config.notificaciones?.correo?.modoPlantilla ?? 'texto'}
                      onChange={(e) => actualizarCorreoSmtp('modoPlantilla', e.target.value)}
                    >
                      <option value="texto">Solo texto</option>
                      <option value="html">HTML con botón</option>
                    </select>
                  </CampoFormulario>
                  <CampoFormulario etiqueta="Cuerpo en texto" id="cfg-smtp-texto">
                    <TextareaTexto
                      id="cfg-smtp-texto"
                      value={config.notificaciones?.correo?.cuerpoTexto ?? ''}
                      onChange={(e) => actualizarCorreoSmtp('cuerpoTexto', e.target.value)}
                      rows={5}
                    />
                  </CampoFormulario>
                  {(config.notificaciones?.correo?.modoPlantilla ?? 'texto') === 'html' && (
                    <CampoFormulario etiqueta="Cuerpo HTML" id="cfg-smtp-html">
                      <TextareaTexto
                        id="cfg-smtp-html"
                        value={config.notificaciones?.correo?.cuerpoHtml ?? ''}
                        onChange={(e) => actualizarCorreoSmtp('cuerpoHtml', e.target.value)}
                        rows={8}
                      />
                    </CampoFormulario>
                  )}
                </details>

                {config.notificaciones?.correo?.listo ? (
                  <p className="configuracion-marca__google-ok">
                    Correo listo para enviar avisos.
                  </p>
                ) : (
                  <p className="configuracion-marca__aviso-falta">
                    Falta correo, contraseña de aplicación y host. Usa el botón de Gmail si aplica.
                  </p>
                )}

                <div className="configuracion-marca__prueba">
                  <CampoFormulario etiqueta="Tu correo para probar" id="cfg-smtp-prueba">
                    <input
                      id="cfg-smtp-prueba"
                      type="email"
                      value={correoPrueba}
                      onChange={(e) => setCorreoPrueba(e.target.value)}
                      placeholder="El tuyo, para ver si llega"
                    />
                  </CampoFormulario>
                  <BotonPrincipal
                    type="button"
                    variante="secundario"
                    onClick={probarCorreo}
                    deshabilitado={probandoCorreo || !config.notificaciones?.correo?.listo}
                  >
                    {probandoCorreo ? 'Enviando...' : 'Probar correo'}
                  </BotonPrincipal>
                </div>
              </div>
            ) : (
              <p className="configuracion-marca__hint">
                Enciéndelo solo si quieres que la clienta reciba un correo al reservar.
              </p>
            )}
          </div>
        </AcordeonSeccion>

        <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={enviando}>
          {enviando ? 'Guardando...' : 'Guardar configuracion'}
        </BotonPrincipal>
      </form>
    </div>
  );
}
