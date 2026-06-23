import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../aplicacion/proveedores/ProveedorAuth';
import {
  BotonPrincipal,
  CampoFormulario,
  Cargando,
  MensajeError,
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
} from '../../../modulos/configuracion_marca/servicios/integracionesServicio';
import '../../../estilos/admin/configuracion/configuracion.css';

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

export default function ConfiguracionMarcaVista() {
  const { recargarSesion } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [config, setConfig] = useState(null);
  const [googleEstado, setGoogleEstado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [conectandoGoogle, setConectandoGoogle] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

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
      setMensajeExito('Google Calendar conectado correctamente.');
      searchParams.delete('google');
      setSearchParams(searchParams, { replace: true });
      obtenerEstadoGoogleCalendar().then(setGoogleEstado).catch(() => {});
    } else if (resultado === 'error') {
      setError('No se pudo conectar Google Calendar.');
      searchParams.delete('google');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
          : { apertura: '10:00', cierre: '19:00', [campo]: valor },
      },
    }));
  }

  function toggleDia(dia, activo) {
    setConfig((prev) => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [dia]: activo ? { apertura: '10:00', cierre: '19:00' } : null,
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
      setMensajeExito('Google Calendar desconectado.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarGuardar(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setMensajeExito(null);

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
      horarios: config.horarios,
    };

    try {
      const actualizada = await actualizarConfiguracionMarca(payload);
      setConfig(actualizada);
      await recargarSesion();
      aplicarTemaMarca(actualizada);
      setMensajeExito('Configuracion guardada correctamente.');
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) return <Cargando />;
  if (error && !config) return <MensajeError mensaje={error} onReintentar={cargar} />;
  if (!config) return null;

  return (
    <div className="configuracion-marca">
      <h1>Configuracion de marca</h1>
      <p className="configuracion-marca__intro">
        Personaliza colores, contacto y horarios. Los cambios se previsualizan al instante.
      </p>

      {error && <MensajeError mensaje={error} />}
      {mensajeExito && <p className="configuracion-marca__exito">{mensajeExito}</p>}

      <form className="configuracion-marca__formulario" onSubmit={manejarGuardar}>
        <section className="configuracion-marca__seccion">
          <h2>Identidad</h2>
          <CampoFormulario etiqueta="Nombre comercial" id="cfg-nombre" requerido>
            <input
              id="cfg-nombre"
              value={config.nombreComercial}
              onChange={(e) => actualizarCampo('nombreComercial', e.target.value)}
              required
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Descripcion" id="cfg-desc">
            <textarea
              id="cfg-desc"
              value={config.descripcion ?? ''}
              onChange={(e) => actualizarCampo('descripcion', e.target.value)}
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Logo" id="cfg-logo">
            <input id="cfg-logo" type="file" accept="image/*" onChange={manejarLogo} />
            {subiendoLogo && <p className="configuracion-marca__hint">Subiendo logo...</p>}
            {config.logo && <img src={config.logo} alt="" className="configuracion-marca__logo" />}
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
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Direccion" id="cfg-dir">
            <input
              id="cfg-dir"
              value={config.direccion ?? ''}
              onChange={(e) => actualizarCampo('direccion', e.target.value)}
            />
          </CampoFormulario>
        </section>

        <section className="configuracion-marca__seccion">
          <h2>Horarios</h2>
          <div className="configuracion-marca__horarios">
            {DIAS.map((dia) => {
              const horario = config.horarios?.[dia];
              const activo = Boolean(horario);
              return (
                <div key={dia} className="configuracion-marca__horario-fila">
                  <label>
                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={(e) => toggleDia(dia, e.target.checked)}
                    />
                    {dia.charAt(0).toUpperCase() + dia.slice(1)}
                  </label>
                  {activo && (
                    <>
                      <input
                        type="time"
                        value={horario.apertura ?? '10:00'}
                        onChange={(e) => actualizarHorario(dia, 'apertura', e.target.value)}
                      />
                      <span>a</span>
                      <input
                        type="time"
                        value={horario.cierre ?? '19:00'}
                        onChange={(e) => actualizarHorario(dia, 'cierre', e.target.value)}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="configuracion-marca__seccion">
          <h2>Google Calendar</h2>
          {!googleEstado?.disponible ? (
            <p className="configuracion-marca__hint">
              La integracion no esta configurada en el servidor. Define GOOGLE_CLIENT_ID,
              GOOGLE_CLIENT_SECRET y GOOGLE_REDIRECT_URI en el backend.
            </p>
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
              <BotonPrincipal variante="secundario" type="button" onClick={desconectarGoogle}>
                Desconectar Google Calendar
              </BotonPrincipal>
            </>
          ) : (
            <>
              <p className="configuracion-marca__hint">
                Conecta tu cuenta de Google para crear eventos al registrar citas.
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

        <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={enviando}>
          {enviando ? 'Guardando...' : 'Guardar configuracion'}
        </BotonPrincipal>
      </form>
    </div>
  );
}
