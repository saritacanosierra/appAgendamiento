import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BotonPrincipal,
  Cargando,
  EstadoCita,
  InputTexto,
  MensajeError,
  ModalMensaje,
  SelectorFecha,
} from '../../../compartido/componentes';
import IconoApp from '../../../compartido/componentes/icono_app/IconoApp';
import { fechaHoyLocal, formatearHoraLegible } from '../../../modulos/reservas/utilidades/calendarioCliente';
import {
  useCronometro,
  formatearCronometro,
  parsearTiempoCronometro,
  sincronizarCronometroConCitasActivas,
  citaPermiteEstadoEnCurso,
  limpiarCronometroPersistido,
  leerCronometroGlobal,
} from '../../../modulos/atencion/hooks/useCronometro';
import {
  obtenerCitasAtencion,
  cerrarServicioAtencion,
} from '../../../modulos/atencion/servicios/atencionServicio';
import { obtenerServiciosAdicionalesActivos } from '../../../modulos/reservas/servicios/serviciosServicio';
import { formatearPrecio } from '../../../compartido/utilidades/temaMarca';
import { mensajeErrorPanelAdmin } from '../../../compartido/utilidades/erroresAdmin';
import { RUTAS_ADMIN } from '../../../compartido/constantes';
import ModalResumenAtencion from './ModalResumenAtencion';
import DisenosGaleriaCita from '../../../componentes/admin/disenos_galeria_cita/DisenosGaleriaCita';
import '../../../estilos/admin/atencion/atencion.css';

const MIN_SEGUNDOS_CRONOMETRO = 5;

const PASOS = [
  { id: 1, etiqueta: 'Seleccionar cita' },
  { id: 2, etiqueta: 'Medir tiempo' },
  { id: 3, etiqueta: 'Confirmar' },
];

function iniciales(nombre) {
  if (!nombre) return '?';
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function extraVacio() {
  return { concepto: '', monto: '' };
}

function extraDesdeServicio(servicio) {
  return {
    concepto: servicio.nombre ?? '',
    monto: Number(servicio.precio) || 0,
    servicioId: servicio.id,
  };
}

function prepararExtrasParaApi(listaExtras) {
  return listaExtras
    .map((extra) => ({
      concepto: String(extra.concepto ?? '').trim(),
      monto: Number(extra.monto) || 0,
      servicioId: extra.servicioId ?? null,
    }))
    .filter((extra) => extra.monto > 0 && (extra.servicioId || extra.concepto))
    .map(({ concepto, monto, servicioId }) =>
      servicioId ? { concepto, monto, servicioId } : { concepto, monto }
    );
}

function mensajeConfirmacionAtencion(cita) {
  const facturacion = cita.facturacion ?? {};
  const precioBase = facturacion.precioBase ?? cita.servicio?.precio ?? 0;
  const precioAdicional = facturacion.precioAdicional ?? 0;
  const precioFinal = facturacion.precioFinal ?? precioBase + precioAdicional;
  const partes = [`${cita.cliente.nombre} — ${cita.servicio.nombre}.`];

  if (precioAdicional > 0) {
    const detalleExtras = (facturacion.extras ?? [])
      .map((extra) => `${extra.concepto} (${formatearPrecio(extra.monto)})`)
      .join(', ');
    partes.push(
      detalleExtras
        ? `Adicionales: ${detalleExtras}.`
        : `Adicionales: ${formatearPrecio(precioAdicional)}.`
    );
  }

  partes.push(`Total facturado: ${formatearPrecio(precioFinal)}.`);
  partes.push(`Duracion: ${facturacion.duracionRealMinutos ?? 0} min.`);

  return partes.join(' ');
}

function pasoActivo(citaSeleccionada, segundosCronometro) {
  if (!citaSeleccionada) return 1;
  if (segundosCronometro < MIN_SEGUNDOS_CRONOMETRO) return 2;
  return 3;
}

function estadoCronometro(activo, segundos) {
  if (activo) return 'Servicio en curso';
  if (segundos > 0) return 'Pausado';
  return 'Listo para iniciar';
}

export default function AtencionVista() {
  const [searchParams, setSearchParams] = useSearchParams();
  const citaParam = searchParams.get('cita');
  const fechaParam = searchParams.get('fecha');
  const autoIniciarRef = useRef(false);
  const citaPreseleccionadaRef = useRef(null);

  const [fecha, setFecha] = useState(() => fechaParam || fechaHoyLocal());
  const [datos, setDatos] = useState(null);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [extras, setExtras] = useState([]);
  const [notas, setNotas] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [modalExito, setModalExito] = useState(null);
  const [citaResumen, setCitaResumen] = useState(null);
  const [mostrarAtendidas, setMostrarAtendidas] = useState(true);
  const [serviciosAdicionales, setServiciosAdicionales] = useState([]);
  const [tiempoManual, setTiempoManual] = useState('');
  const [errorTiempoManual, setErrorTiempoManual] = useState(null);
  const editandoTiempoRef = useRef(false);

  const cronometro = useCronometro(citaSeleccionada?.id);
  const { iniciar: iniciarCronometro } = cronometro;

  const hoy = fechaHoyLocal();
  const progresoAnillo = `${Math.min(100, (cronometro.segundos / 3600) * 100)}%`;

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const resultado = await obtenerCitasAtencion(fecha);
      sincronizarCronometroConCitasActivas(resultado.pendientes);
      setDatos(resultado);
    } catch (err) {
      setError(mensajeErrorPanelAdmin(err));
      setDatos(null);
    } finally {
      setCargando(false);
    }
  }, [fecha]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!datos?.pendientes || !citaSeleccionada) return;

    const sigueActiva = datos.pendientes.some(
      (c) => c.id === citaSeleccionada.id && citaPermiteEstadoEnCurso(c.estado)
    );

    if (!sigueActiva) {
      limpiarCronometroPersistido();
      setCitaSeleccionada(null);
      setExtras([]);
      setNotas('');
      setTiempoManual('');
      setErrorTiempoManual(null);
      editandoTiempoRef.current = false;
    }
  }, [datos, citaSeleccionada]);

  useEffect(() => {
    function cerrarSeleccionSiCronometroLimpio() {
      if (!citaSeleccionada) return;

      const data = leerCronometroGlobal();
      const idPersistido = data?.citaId ? Number(data.citaId) : null;

      if (idPersistido !== Number(citaSeleccionada.id)) {
        setCitaSeleccionada(null);
        setExtras([]);
        setNotas('');
        setTiempoManual('');
        setErrorTiempoManual(null);
        editandoTiempoRef.current = false;
      }
    }

    window.addEventListener('spa:cronometro-actualizado', cerrarSeleccionSiCronometroLimpio);
    return () => {
      window.removeEventListener('spa:cronometro-actualizado', cerrarSeleccionSiCronometroLimpio);
    };
  }, [citaSeleccionada]);

  useEffect(() => {
    obtenerServiciosAdicionalesActivos()
      .then((lista) => setServiciosAdicionales(Array.isArray(lista) ? lista : []))
      .catch(() => setServiciosAdicionales([]));
  }, []);

  useEffect(() => {
    if (!datos || !citaParam) return;

    const citaId = Number(citaParam);
    if (!citaId || citaPreseleccionadaRef.current === citaId) return;

    const cita = datos.pendientes.find((c) => c.id === citaId);
    if (!cita) return;

    citaPreseleccionadaRef.current = citaId;
    setCitaSeleccionada(cita);
    setExtras([]);
    setNotas(cita.notasInternas ?? '');
    autoIniciarRef.current = true;
    setSearchParams({}, { replace: true });
  }, [datos, citaParam, setSearchParams]);

  useEffect(() => {
    if (!autoIniciarRef.current || !citaSeleccionada?.id) return;
    autoIniciarRef.current = false;
    iniciarCronometro();
  }, [citaSeleccionada?.id, iniciarCronometro]);

  useEffect(() => {
    if (editandoTiempoRef.current) return;
    if (!cronometro.activo && cronometro.segundos > 0) {
      setTiempoManual(cronometro.texto);
      setErrorTiempoManual(null);
    } else if (cronometro.segundos === 0) {
      setTiempoManual('');
      setErrorTiempoManual(null);
    }
  }, [cronometro.activo, cronometro.segundos, cronometro.texto]);

  const cronometroPausado = !cronometro.activo && cronometro.segundos > 0;

  function aplicarTiempoManual() {
    const segundosParseados = parsearTiempoCronometro(tiempoManual);
    if (segundosParseados === null) {
      setErrorTiempoManual('Usa el formato mm:ss (ej. 04:45) o solo minutos.');
      return;
    }
    cronometro.establecerSegundos(segundosParseados);
    setTiempoManual(formatearCronometro(segundosParseados));
    setErrorTiempoManual(null);
    editandoTiempoRef.current = false;
  }

  const seleccionarCita = (cita) => {
    if (cita.estado === 'completada') return;
    if (citaSeleccionada?.id === cita.id) {
      setCitaSeleccionada(null);
      return;
    }
    setCitaSeleccionada(cita);
    setExtras([]);
    setNotas(cita.notasInternas ?? '');
    setTiempoManual('');
    setErrorTiempoManual(null);
    editandoTiempoRef.current = false;
  };

  function renderPanelAtencion(cita) {
    const pasoActualCita = pasoActivo(cita, cronometro.segundos);
    const listoConfirmarCita = cronometro.segundos >= MIN_SEGUNDOS_CRONOMETRO;

    return (
      <>
        <nav className="atencion-vista__progreso" aria-label="Progreso de atención">
          {PASOS.map((paso) => {
            const completado = paso.id < pasoActualCita;
            const activo = paso.id === pasoActualCita;
            return (
              <div
                key={paso.id}
                className={[
                  'atencion-vista__paso',
                  completado ? 'atencion-vista__paso--completado' : '',
                  activo ? 'atencion-vista__paso--activo' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="atencion-vista__paso-indicador">
                  {completado ? '✓' : paso.id}
                </span>
                <span className="atencion-vista__paso-etiqueta">{paso.etiqueta}</span>
              </div>
            );
          })}
        </nav>

        <div className="atencion-vista__panel-cuerpo">
          <div className="atencion-vista__cliente">
            <div className="atencion-vista__avatar" aria-hidden="true">
              {iniciales(cita.cliente.nombre)}
            </div>
            <div className="atencion-vista__cliente-info">
              <h2>{cita.cliente.nombre}</h2>
              <p className="atencion-vista__cliente-servicio">{cita.servicio.nombre}</p>
              <ul className="atencion-vista__cliente-detalles">
                <li>
                  {formatearHoraLegible(cita.horaInicio)} — {formatearHoraLegible(cita.horaFin)}
                </li>
                <li>{cita.cliente.telefono}</li>
              </ul>
            </div>
          </div>

          <DisenosGaleriaCita disenos={cita.disenosGaleria} variante="panel" />

          <div className="atencion-vista__cronometro">
            <div
              className={`atencion-vista__cronometro-ring ${
                cronometro.activo ? 'atencion-vista__cronometro-ring--activo' : ''
              }`}
              style={{ '--progreso-cronometro': progresoAnillo }}
            >
              <div className="atencion-vista__cronometro-inner">
                <span className="atencion-vista__cronometro-estado">
                  {estadoCronometro(cronometro.activo, cronometro.segundos)}
                </span>
                <span className="atencion-vista__cronometro-display" aria-live="polite">
                  {cronometro.texto}
                </span>
                <span className="atencion-vista__cronometro-min">
                  ~{cronometro.minutosRedondeados} min al confirmar
                </span>
              </div>
            </div>
            <div className="atencion-vista__cronometro-acciones">
              {!cronometro.activo && cronometro.segundos === 0 && (
                <BotonPrincipal type="button" onClick={cronometro.iniciar}>
                  Iniciar servicio
                </BotonPrincipal>
              )}
              {cronometro.activo && (
                <BotonPrincipal type="button" variante="secundario" onClick={cronometro.pausar}>
                  Pausar
                </BotonPrincipal>
              )}
              {!cronometro.activo && cronometro.segundos > 0 && (
                <BotonPrincipal type="button" onClick={cronometro.reanudar}>
                  Reanudar
                </BotonPrincipal>
              )}
              {cronometro.segundos > 0 && (
                <BotonPrincipal type="button" variante="secundario" onClick={cronometro.reiniciar}>
                  Reiniciar
                </BotonPrincipal>
              )}
            </div>

            {cronometroPausado && (
              <div className="atencion-vista__tiempo-manual">
                <label htmlFor={`atencion-tiempo-manual-${cita.id}`}>
                  Tiempo registrado
                  <span className="atencion-vista__tiempo-manual-hint">
                    Ajusta manualmente si olvidaste pausar o necesitas sumar minutos.
                  </span>
                </label>
                <div className="atencion-vista__tiempo-manual-fila">
                  <input
                    id={`atencion-tiempo-manual-${cita.id}`}
                    type="text"
                    inputMode="numeric"
                    className="atencion-vista__tiempo-manual-input"
                    value={tiempoManual}
                    placeholder="mm:ss"
                    onFocus={() => {
                      editandoTiempoRef.current = true;
                    }}
                    onChange={(e) => {
                      setTiempoManual(e.target.value);
                      setErrorTiempoManual(null);
                    }}
                    onBlur={aplicarTiempoManual}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        aplicarTiempoManual();
                        e.currentTarget.blur();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="atencion-vista__tiempo-manual-aplicar"
                    onClick={aplicarTiempoManual}
                  >
                    Aplicar
                  </button>
                </div>
                {errorTiempoManual && (
                  <p className="atencion-vista__tiempo-manual-error">{errorTiempoManual}</p>
                )}
              </div>
            )}
          </div>

          <div className="atencion-vista__bloque">
            <div className="atencion-vista__bloque-cabecera">
              <div>
                <h3>Costos adicionales</h3>
                <p className="atencion-vista__bloque-desc">
                  Agrega cargos configurados en Servicios o un concepto puntual manual.
                </p>
              </div>
            </div>

            {serviciosAdicionales.length > 0 ? (
              <div className="atencion-vista__sugerencias">
                {serviciosAdicionales.map((servicio) => {
                  const activo = extras.some((extra) => extra.servicioId === servicio.id);
                  return (
                    <button
                      key={servicio.id}
                      type="button"
                      className={`atencion-vista__sugerencia${
                        activo ? ' atencion-vista__sugerencia--activa' : ''
                      }`}
                      aria-pressed={activo}
                      onClick={() => toggleExtraServicio(servicio)}
                    >
                      {activo ? '✓' : '+'} {servicio.nombre}
                      <span className="atencion-vista__sugerencia-monto">
                        {formatearPrecio(servicio.precio)}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="atencion-vista__sin-adicionales">
                No hay adicionales activos.{' '}
                <Link to={RUTAS_ADMIN.servicios}>Configuralos en Servicios</Link>.
              </p>
            )}

            {extrasManuales.length > 0 && (
              <div className="atencion-vista__extras-lista">
                {extrasManuales.map((extra, indice) => (
                  <div key={indice} className="atencion-vista__extra-fila">
                    <label>
                      Concepto
                      <InputTexto
                        value={extra.concepto}
                        onChange={(e) => actualizarExtra(indice, 'concepto', e.target.value)}
                        placeholder="Ej. Uña fracturada"
                      />
                    </label>
                    <label>
                      Monto
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={extra.monto}
                        onChange={(e) => actualizarExtra(indice, 'monto', e.target.value)}
                      />
                    </label>
                    <button
                      type="button"
                      className="atencion-vista__extra-quitar"
                      onClick={() => quitarExtra(indice)}
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}

            <BotonPrincipal
              type="button"
              variante="secundario"
              className="atencion-vista__btn-agregar"
              onClick={agregarExtraManual}
            >
              + Agregar concepto puntual
            </BotonPrincipal>
          </div>

          <div className="atencion-vista__totales">
            <p className="atencion-vista__totales-fila">
              <span>Precio base</span>
              <strong>{formatearPrecio(precioBase)}</strong>
            </p>
            <p className="atencion-vista__totales-fila">
              <span>Adicionales</span>
              <strong>{formatearPrecio(totalExtras)}</strong>
            </p>
            <p className="atencion-vista__totales-fila atencion-vista__totales-fila--total">
              <span>Total a facturar</span>
              <strong>{formatearPrecio(precioTotal)}</strong>
            </p>
          </div>

          <label className="atencion-vista__notas">
            <span>Notas internas (opcional)</span>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Detalles del servicio prestado…"
            />
          </label>

          <div className="atencion-vista__confirmar">
            <p
              className={`atencion-vista__confirmar-aviso ${
                listoConfirmarCita ? 'atencion-vista__confirmar-aviso--listo' : ''
              }`}
            >
              {listoConfirmarCita
                ? 'Tiempo registrado. Puedes confirmar y facturar el servicio.'
                : `Inicia el cronómetro y registra al menos ${MIN_SEGUNDOS_CRONOMETRO} segundos para continuar.`}
            </p>
            <BotonPrincipal
              type="button"
              anchoCompleto
              deshabilitado={enviando || !listoConfirmarCita}
              onClick={confirmarServicio}
            >
              {enviando ? 'Guardando…' : 'Confirmar servicio y facturar'}
            </BotonPrincipal>
          </div>
        </div>
      </>
    );
  }

  const toggleExtraServicio = (servicio) => {
    setExtras((prev) => {
      const activo = prev.some((item) => item.servicioId === servicio.id);
      if (activo) {
        return prev.filter((item) => item.servicioId !== servicio.id);
      }
      return [...prev, extraDesdeServicio(servicio)];
    });
  };

  const agregarExtraManual = () => {
    setExtras((prev) => [...prev, extraVacio()]);
  };

  const actualizarExtra = (indiceManual, campo, valor) => {
    setExtras((prev) => {
      const manuales = prev.filter((item) => !item.servicioId);
      const extraEditar = manuales[indiceManual];
      if (!extraEditar) return prev;
      return prev.map((item) =>
        item === extraEditar ? { ...item, [campo]: valor } : item
      );
    });
  };

  const quitarExtra = (indiceManual) => {
    setExtras((prev) => {
      const manuales = prev.filter((item) => !item.servicioId);
      const extraQuitar = manuales[indiceManual];
      if (!extraQuitar) return prev;
      return prev.filter((item) => item !== extraQuitar);
    });
  };

  const precioBase = citaSeleccionada?.servicio?.precio ?? 0;
  const extrasManuales = extras.filter((extra) => !extra.servicioId);
  const totalExtras = extras.reduce((sum, e) => sum + (Number(e.monto) || 0), 0);
  const precioTotal = precioBase + totalExtras;

  const confirmarServicio = async () => {
    if (!citaSeleccionada) return;

    if (cronometro.segundos < MIN_SEGUNDOS_CRONOMETRO) {
      setError(`Inicia el cronometro y registra al menos ${MIN_SEGUNDOS_CRONOMETRO} segundos de servicio.`);
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      const extrasEnviar = prepararExtrasParaApi(extras);
      const citaCerrada = await cerrarServicioAtencion(citaSeleccionada.id, {
        duracionMinutos: cronometro.minutosRedondeados,
        extras: extrasEnviar,
        notasInternas: notas.trim() || null,
      });

      cronometro.limpiarPersistencia();
      setCitaSeleccionada(null);
      setExtras([]);
      setNotas('');
      await cargar();

      setModalExito({
        titulo: 'Servicio confirmado',
        mensaje: mensajeConfirmacionAtencion(citaCerrada),
      });
    } catch (err) {
      setError(mensajeErrorPanelAdmin(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="atencion-vista">
      <header className="atencion-vista__cabecera">
        <div className="atencion-vista__cabecera-texto">
          <h1>Atención profesional</h1>
          <p className="atencion-vista__subtitulo">
            Registra el tiempo del servicio, confirma la prestación y factura con precisión
            incluyendo cargos adicionales.
          </p>
        </div>
        <div className="atencion-vista__toolbar" aria-label="Fecha y actualización">
          <SelectorFecha valor={fecha} onChange={setFecha} modo="nativo" />
          <button
            type="button"
            className={`atencion-vista__chip-hoy ${fecha === hoy ? 'atencion-vista__chip-hoy--activo' : ''}`}
            onClick={() => setFecha(hoy)}
          >
            Hoy
          </button>
          <BotonPrincipal
            type="button"
            className="atencion-vista__btn-actualizar"
            onClick={cargar}
            deshabilitado={cargando}
            variante="secundario"
            aria-label={cargando ? 'Actualizando citas' : 'Actualizar citas'}
          >
            <span className="atencion-vista__btn-actualizar-texto">
              {cargando ? 'Actualizando…' : 'Actualizar'}
            </span>
            <span className="atencion-vista__btn-actualizar-icono" aria-hidden="true">
              ↻
            </span>
          </BotonPrincipal>
        </div>
      </header>

      {error && <MensajeError mensaje={error} />}

      {datos && (
        <section className="atencion-vista__resumen" aria-label="Resumen del día">
          <div className="atencion-vista__tarjeta">
            <span className="atencion-vista__tarjeta-icono" aria-hidden="true">⏳</span>
            <div className="atencion-vista__tarjeta-texto">
              <span>Pendientes</span>
              <strong>{datos.resumen.pendientes}</strong>
            </div>
          </div>
          <div className="atencion-vista__tarjeta">
            <span className="atencion-vista__tarjeta-icono" aria-hidden="true">✓</span>
            <div className="atencion-vista__tarjeta-texto">
              <span>Atendidas</span>
              <strong>{datos.resumen.atendidas}</strong>
            </div>
          </div>
          <div className="atencion-vista__tarjeta atencion-vista__tarjeta--ingreso">
            <span className="atencion-vista__tarjeta-icono" aria-hidden="true">$</span>
            <div className="atencion-vista__tarjeta-texto">
              <span>Ingreso confirmado</span>
              <strong>{formatearPrecio(datos.resumen.ingresoAtendido)}</strong>
            </div>
          </div>
        </section>
      )}

      {cargando && !datos ? (
        <Cargando mensaje="Cargando citas del día…" />
      ) : (
        <div className="atencion-vista__layout">
          <section className="atencion-vista__cola" aria-label="Cola de citas">
            {datos?.atendidas?.length > 0 && (
              <div className="atencion-vista__atendidas">
                <button
                  type="button"
                  className="atencion-vista__atendidas-toggle"
                  onClick={() => setMostrarAtendidas((v) => !v)}
                  aria-expanded={mostrarAtendidas}
                >
                  <span>Completadas hoy ({datos.atendidas.length})</span>
                  <span>{mostrarAtendidas ? 'Ocultar' : 'Ver'}</span>
                </button>
                {mostrarAtendidas && (
                  <div className="atencion-vista__atendidas-lista">
                    {datos.atendidas.map((cita) => (
                      <div key={cita.id} className="atencion-vista__atendida-item">
                        <span className="atencion-vista__atendida-info">
                          <strong>{formatearHoraLegible(cita.horaInicio)}</strong>
                          {' · '}
                          {cita.cliente.nombre}
                          {cita.facturacion.duracionRealMinutos != null && (
                            <> · {cita.facturacion.duracionRealMinutos} min</>
                          )}
                        </span>
                        <strong className="atencion-vista__atendida-precio">
                          {formatearPrecio(cita.facturacion.precioFinal)}
                        </strong>
                        <button
                          type="button"
                          className="atencion-vista__atendida-ver"
                          onClick={() => setCitaResumen(cita)}
                          aria-label={`Ver resumen de ${cita.cliente.nombre}`}
                        >
                          <IconoApp nombre="ojo" tamano="sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="atencion-vista__cola-cabecera">
              <h2>Citas del día</h2>
              {datos?.pendientes?.length > 0 && (
                <span className="atencion-vista__badge">{datos.pendientes.length}</span>
              )}
            </div>

            {datos?.pendientes?.length === 0 ? (
              <div className="atencion-vista__vacio">
                <span className="atencion-vista__vacio-icono" aria-hidden="true">📋</span>
                <p>No hay citas pendientes para esta fecha.</p>
              </div>
            ) : (
              <>
                <p className="atencion-vista__cola-ayuda">
                  Toca una cita para expandir el cronómetro y facturación. Vuelve a tocar para cerrar.
                </p>
                <ul className="atencion-vista__citas">
                  {datos?.pendientes?.map((cita) => {
                    const expandida = citaSeleccionada?.id === cita.id;
                    const enCurso = expandida && cronometro.activo && citaPermiteEstadoEnCurso(cita.estado);
                    return (
                      <li
                        key={cita.id}
                        className={`atencion-vista__cita-item${
                          expandida ? ' atencion-vista__cita-item--abierta' : ''
                        }${enCurso ? ' cita-en-curso' : ''}`}
                      >
                        <button
                          type="button"
                          className={`atencion-vista__cita ${
                            expandida ? 'atencion-vista__cita--activa' : ''
                          }`}
                          onClick={() => seleccionarCita(cita)}
                          aria-expanded={expandida}
                        >
                          <div className="atencion-vista__cita-hora-badge">
                            <strong>{formatearHoraLegible(cita.horaInicio)}</strong>
                            <span>{formatearHoraLegible(cita.horaFin)}</span>
                          </div>
                          <div className="atencion-vista__cita-info">
                            <span className="atencion-vista__cita-cliente">{cita.cliente.nombre}</span>
                            <span className="atencion-vista__cita-servicio">{cita.servicio.nombre}</span>
                            <div className="atencion-vista__cita-meta">
                              <EstadoCita estado={cita.estado} canceladaPor={cita.canceladaPor} />
                              {enCurso && (
                                <span className="cita-en-curso__etiqueta">En curso</span>
                              )}
                              {cita.disenosGaleria?.length > 0 && (
                                <span className="atencion-vista__cita-disenos">
                                  {cita.disenosGaleria.length} diseno
                                  {cita.disenosGaleria.length === 1 ? '' : 's'}
                                </span>
                              )}
                              <span className="atencion-vista__cita-duracion">
                                {cita.servicio.duracionMinutos} min est.
                              </span>
                            </div>
                          </div>
                          <span className="atencion-vista__cita-precio">
                            {formatearPrecio(cita.servicio.precio)}
                          </span>
                          <span className="atencion-vista__cita-expandir" aria-hidden="true">
                            {expandida ? '▲' : '▼'}
                          </span>
                        </button>

                        {expandida && (
                          <div className="atencion-vista__panel atencion-vista__cita-panel">
                            {renderPanelAtencion(cita)}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>
        </div>
      )}

      {modalExito && (
        <ModalMensaje
          abierto
          titulo={modalExito.titulo}
          mensaje={modalExito.mensaje}
          onCerrar={() => setModalExito(null)}
        />
      )}

      <ModalResumenAtencion
        cita={citaResumen}
        abierto={Boolean(citaResumen)}
        onCerrar={() => setCitaResumen(null)}
      />
    </div>
  );
}
