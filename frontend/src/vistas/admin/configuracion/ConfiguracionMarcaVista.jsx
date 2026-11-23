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
    if (cargando || !config || hash !== '#google-calendar') return;
    const seccion = document.getElementById('google-calendar');
    seccion?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

      <AyudaPasoTienda paso="marca" />
      <h1>Mi marca — perfil e identidad</h1>
      <p className="configuracion-marca__intro">
        Personaliza nombre, colores, contacto, horarios y conecta el Google Calendar de tu empresa.
        Para las fotos del carrusel del inicio, usa la sección Carrusel del menú.
      </p>

      {error && <MensajeError mensaje={error} />}

      <form className="configuracion-marca__formulario" onSubmit={manejarGuardar}>
        <section className="configuracion-marca__seccion">
          <h2>Identidad</h2>
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
        </section>

        <section className="configuracion-marca__seccion">
          <h2>Colores</h2>
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
        </section>

        <section className="configuracion-marca__seccion">
          <h2>Contacto</h2>
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
        </section>

        <section className="configuracion-marca__seccion" id="equipo">
          <h2>Equipo</h2>
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
        </section>

        <section className="configuracion-marca__seccion configuracion-marca__seccion--horarios">
          <div className="configuracion-marca__seccion-cabecera">
            <div>
              <h2>Horarios</h2>
              <p className="configuracion-marca__hint">
                Activa los días que atiendes y define apertura, cierre y descansos (ej. comida).
              </p>
            </div>
          </div>

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
        </section>

        <section id="google-calendar" className="configuracion-marca__seccion configuracion-marca__seccion--destacada">
          <h2>Google Calendar</h2>
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
        </section>

        <section className="configuracion-marca__seccion">
          <h2>Premio por puntos</h2>
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
        </section>

        <section className="configuracion-marca__seccion" id="confirmacion-citas">
          <h2>Confirmación de citas</h2>
          <p className="configuracion-marca__hint">
            Elige WhatsApp, correo o ambos. Si un aviso falla, la cita sigue activa y se pide
            comunicarse directamente con la marca.
          </p>

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
            <span>Avisar por WhatsApp</span>
          </label>

          <label className="configuracion-marca__horario-toggle configuracion-marca__whatsapp-toggle">
            <input
              type="checkbox"
              checked={Boolean(config.notificaciones?.canales?.correo)}
              onChange={(e) => actualizarNotificaciones('correo', e.target.checked)}
            />
            <span className="configuracion-marca__horario-switch" aria-hidden="true" />
            <span>Avisar por correo</span>
          </label>

          <div className="configuracion-marca__bloque-aviso">
            <h3>Correo del propietario</h3>
            <p className="configuracion-marca__hint">
              Sale gratis desde tu propio buzón. En Gmail usa una contraseña de aplicación
              (Cuenta Google → Seguridad → Contraseñas de aplicaciones). Host típico:
              smtp.gmail.com, puerto 587.
            </p>
            <p className="configuracion-marca__hint configuracion-marca__hint--bloque">
              Variables: {'{{nombre}}'}, {'{{marca}}'}, {'{{servicio}}'}, {'{{fecha}}'}, {'{{hora}}'}, {'{{codigo}}'}, {'{{url_confirmacion}}'}
            </p>

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
              <span>Conexión segura (SSL/TLS, suele ser puerto 465)</span>
            </label>
            <CampoFormulario etiqueta="Usuario del correo" id="cfg-smtp-usuario">
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
                ? 'Contraseña SMTP (déjala vacía para no cambiarla)'
                : 'Contraseña SMTP'}
              id="cfg-smtp-pass"
            >
              <CampoContrasena
                id="cfg-smtp-pass"
                value={correoSmtpContrasenaNueva}
                onChange={(e) => setCorreoSmtpContrasenaNueva(e.target.value)}
                placeholder={config.notificaciones?.correo?.contrasenaConfigurada
                  ? 'Déjala vacía para no cambiarla'
                  : 'Contraseña de aplicación'}
                autoComplete="new-password"
              />
            </CampoFormulario>
            <CampoFormulario etiqueta="Remitente (De:)" id="cfg-smtp-remitente">
              <input
                id="cfg-smtp-remitente"
                value={config.notificaciones?.correo?.remitente ?? ''}
                onChange={(e) => actualizarCorreoSmtp('remitente', e.target.value)}
                placeholder="Nombre <tunegocio@gmail.com>"
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
            <CampoFormulario etiqueta="Asunto" id="cfg-smtp-asunto">
              <input
                id="cfg-smtp-asunto"
                value={config.notificaciones?.correo?.asunto ?? ''}
                onChange={(e) => actualizarCorreoSmtp('asunto', e.target.value)}
                placeholder="Confirmacion de cita — {{marca}}"
              />
            </CampoFormulario>
            <CampoFormulario etiqueta="Cuerpo en texto" id="cfg-smtp-texto">
              <TextareaTexto
                id="cfg-smtp-texto"
                value={config.notificaciones?.correo?.cuerpoTexto ?? ''}
                onChange={(e) => actualizarCorreoSmtp('cuerpoTexto', e.target.value)}
                rows={6}
              />
            </CampoFormulario>
            {(config.notificaciones?.correo?.modoPlantilla ?? 'texto') === 'html' && (
              <CampoFormulario etiqueta="Cuerpo HTML" id="cfg-smtp-html" ayuda="Incluye {{url_confirmacion}} en el botón de confirmación.">
                <TextareaTexto
                  id="cfg-smtp-html"
                  value={config.notificaciones?.correo?.cuerpoHtml ?? ''}
                  onChange={(e) => actualizarCorreoSmtp('cuerpoHtml', e.target.value)}
                  rows={10}
                />
              </CampoFormulario>
            )}
            {config.notificaciones?.correo?.listo ? (
              <p className="configuracion-marca__google-ok">
                SMTP listo. Los avisos saldrán desde este buzón.
              </p>
            ) : (
              <p className="configuracion-marca__hint">
                Guarda host, usuario y contraseña, luego prueba el envío.
              </p>
            )}
            <div className="configuracion-marca__google-acciones">
              <CampoFormulario etiqueta="Correo de prueba" id="cfg-smtp-prueba">
                <input
                  id="cfg-smtp-prueba"
                  type="email"
                  value={correoPrueba}
                  onChange={(e) => setCorreoPrueba(e.target.value)}
                  placeholder="Tu correo para recibir la prueba"
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

          <div className="configuracion-marca__bloque-aviso">
            <h3>WhatsApp Business</h3>
            <details className="configuracion-marca__guia">
              <summary>Cómo conseguir Phone Number ID y token</summary>
              <ol>
                <li>Entra a Meta Business Suite / WhatsApp Manager.</li>
                <li>Abre tu número de WhatsApp Business API.</li>
                <li>Copia el Phone Number ID (número técnico, no el celular público).</li>
                <li>En Desarrolladores de Meta crea o abre tu app y genera un token de acceso permanente.</li>
                <li>Pega ambos aquí, elige el indicativo del país y guarda.</li>
                <li>Prueba el envío con tu celular antes de activarlo con clientas.</li>
              </ol>
            </details>

            <CampoFormulario etiqueta="Phone Number ID (Meta)" id="cfg-wa-phone-id">
              <input
                id="cfg-wa-phone-id"
                value={config.whatsappApi?.phoneNumberId ?? ''}
                onChange={(e) => actualizarWhatsappApi('phoneNumberId', e.target.value)}
                placeholder="ID técnico de WhatsApp Manager"
              />
            </CampoFormulario>

            <CampoFormulario
              etiqueta={config.whatsappApi?.tokenConfigurado ? 'Token de acceso (déjalo vacío para no cambiarlo)' : 'Token de acceso'}
              id="cfg-wa-token"
            >
              <CampoContrasena
                id="cfg-wa-token"
                value={whatsappTokenNuevo}
                onChange={(e) => setWhatsappTokenNuevo(e.target.value)}
                placeholder={config.whatsappApi?.tokenConfigurado ? 'Déjalo vacío para no cambiarlo' : 'Pega el token de Meta'}
                autoComplete="new-password"
              />
            </CampoFormulario>

            <CampoFormulario etiqueta="Indicativo" id="cfg-wa-pais">
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

            <CampoFormulario
              etiqueta="Mensaje de confirmación WhatsApp"
              id="cfg-wa-confirmacion"
              ayuda="Usa las mismas variables que el correo."
            >
              <TextareaTexto
                id="cfg-wa-confirmacion"
                value={config.whatsappApi?.plantillaConfirmacion ?? ''}
                onChange={(e) => actualizarWhatsappApi('plantillaConfirmacion', e.target.value)}
                rows={5}
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

            {config.whatsappApi?.configurado ? (
              <p className="configuracion-marca__google-ok">
                Configurado — los mensajes saldrán desde el número público: {config.whatsappApi?.numeroPublico || 'sin número público'}.
              </p>
            ) : (
              <p className="configuracion-marca__hint">
                Guarda Phone Number ID y token, luego prueba el envío.
              </p>
            )}

            <div className="configuracion-marca__google-acciones">
              <CampoFormulario etiqueta="Teléfono de prueba" id="cfg-wa-prueba">
                <input
                  id="cfg-wa-prueba"
                  value={telefonoPruebaWhatsapp}
                  onChange={(e) => setTelefonoPruebaWhatsapp(e.target.value)}
                  placeholder="10 dígitos"
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
        </section>

        <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={enviando}>
          {enviando ? 'Guardando...' : 'Guardar configuracion'}
        </BotonPrincipal>
      </form>
    </div>
  );
}
