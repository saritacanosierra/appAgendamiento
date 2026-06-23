import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BotonPrincipal,
  Cargando,
  EstadoCita,
  MensajeError,
  ModalMensaje,
  SelectorFecha,
} from '../../../compartido/componentes';
import IconoApp from '../../../compartido/componentes/icono_app/IconoApp';
import { fechaHoyLocal, formatearHoraLegible } from '../../../modulos/reservas/utilidades/calendarioCliente';
import { useCronometro } from '../../../modulos/atencion/hooks/useCronometro';
import {
  obtenerCitasAtencion,
  cerrarServicioAtencion,
} from '../../../modulos/atencion/servicios/atencionServicio';
import { formatearPrecio } from '../../../compartido/utilidades/temaMarca';
import '../../../estilos/admin/atencion/atencion.css';

const MIN_SEGUNDOS_CRONOMETRO = 5;

const EXTRAS_SUGERIDOS = [
  { concepto: 'Uña fracturada', monto: 50 },
  { concepto: 'Accesorio / decoración', monto: 80 },
  { concepto: 'Retoque', monto: 30 },
];

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
  const [mostrarAtendidas, setMostrarAtendidas] = useState(true);

  const cronometro = useCronometro(citaSeleccionada?.id);
  const { iniciar: iniciarCronometro } = cronometro;

  const hoy = fechaHoyLocal();
  const pasoActual = pasoActivo(citaSeleccionada, cronometro.segundos);
  const listoConfirmar = cronometro.segundos >= MIN_SEGUNDOS_CRONOMETRO;
  const progresoAnillo = `${Math.min(100, (cronometro.segundos / 3600) * 100)}%`;

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const resultado = await obtenerCitasAtencion(fecha);
      setDatos(resultado);
    } catch (err) {
      setError(err.message);
      setDatos(null);
    } finally {
      setCargando(false);
    }
  }, [fecha]);

  useEffect(() => {
    cargar();
  }, [cargar]);

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

  const seleccionarCita = (cita) => {
    if (cita.estado === 'completada') return;
    setCitaSeleccionada(cita);
    setExtras([]);
    setNotas(cita.notasInternas ?? '');
  };

  const agregarExtra = (plantilla = extraVacio()) => {
    setExtras((prev) => [...prev, { ...plantilla }]);
  };

  const actualizarExtra = (indice, campo, valor) => {
    setExtras((prev) =>
      prev.map((item, i) => (i === indice ? { ...item, [campo]: valor } : item))
    );
  };

  const quitarExtra = (indice) => {
    setExtras((prev) => prev.filter((_, i) => i !== indice));
  };

  const precioBase = citaSeleccionada?.servicio?.precio ?? 0;
  const totalExtras = extras.reduce((sum, e) => sum + (Number(e.monto) || 0), 0);
  const precioTotal = precioBase + totalExtras;

  const extrasValidos = extras
    .filter((e) => e.concepto.trim() && Number(e.monto) > 0)
    .map((e) => ({ concepto: e.concepto.trim(), monto: Number(e.monto) }));

  const confirmarServicio = async () => {
    if (!citaSeleccionada) return;

    if (cronometro.segundos < MIN_SEGUNDOS_CRONOMETRO) {
      setError(`Inicia el cronometro y registra al menos ${MIN_SEGUNDOS_CRONOMETRO} segundos de servicio.`);
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      const citaCerrada = await cerrarServicioAtencion(citaSeleccionada.id, {
        duracionMinutos: cronometro.minutosRedondeados,
        extras: extrasValidos,
        notasInternas: notas.trim() || null,
      });

      cronometro.limpiarPersistencia();
      setCitaSeleccionada(null);
      setExtras([]);
      setNotas('');
      await cargar();

      setModalExito({
        titulo: 'Servicio confirmado',
        mensaje: `${citaCerrada.cliente.nombre} — ${citaCerrada.servicio.nombre}. Total facturado: ${formatearPrecio(citaCerrada.facturacion.precioFinal)}. Duracion: ${citaCerrada.facturacion.duracionRealMinutos} min.`,
      });
    } catch (err) {
      setError(err.message);
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
        <div className="atencion-vista__cabecera-acciones">
          <SelectorFecha valor={fecha} onChange={setFecha} etiqueta="Fecha" modo="nativo" />
          <button
            type="button"
            className={`atencion-vista__chip-hoy ${fecha === hoy ? 'atencion-vista__chip-hoy--activo' : ''}`}
            onClick={() => setFecha(hoy)}
          >
            Hoy
          </button>
          <BotonPrincipal type="button" onClick={cargar} deshabilitado={cargando} variante="secundario">
            {cargando ? 'Actualizando…' : 'Actualizar'}
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
              <ul className="atencion-vista__citas">
                {datos?.pendientes?.map((cita) => (
                  <li key={cita.id}>
                    <button
                      type="button"
                      className={`atencion-vista__cita ${
                        citaSeleccionada?.id === cita.id ? 'atencion-vista__cita--activa' : ''
                      }`}
                      onClick={() => seleccionarCita(cita)}
                      aria-pressed={citaSeleccionada?.id === cita.id}
                    >
                      <div className="atencion-vista__cita-hora-badge">
                        <strong>{formatearHoraLegible(cita.horaInicio)}</strong>
                        <span>{formatearHoraLegible(cita.horaFin)}</span>
                      </div>
                      <div className="atencion-vista__cita-info">
                        <span className="atencion-vista__cita-cliente">{cita.cliente.nombre}</span>
                        <span className="atencion-vista__cita-servicio">{cita.servicio.nombre}</span>
                        <div className="atencion-vista__cita-meta">
                          <EstadoCita estado={cita.estado} />
                          <span className="atencion-vista__cita-duracion">
                            {cita.servicio.duracionMinutos} min est.
                          </span>
                        </div>
                      </div>
                      <span className="atencion-vista__cita-precio">
                        {formatearPrecio(cita.servicio.precio)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

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
                        <strong>{formatearPrecio(cita.facturacion.precioFinal)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="atencion-vista__workspace" aria-label="Panel de atención">
            <div className="atencion-vista__workspace-inner">
              <div className="atencion-vista__panel">
                {!citaSeleccionada ? (
                  <div className="atencion-vista__panel-placeholder">
                    <div className="atencion-vista__panel-placeholder-icono" aria-hidden="true">
                      <IconoApp nombre="atencion" tamano="xl" />
                    </div>
                    <h2>Selecciona una cita</h2>
                    <p>
                      Elige una cita de la cola para iniciar el cronómetro y registrar la
                      facturación del servicio.
                    </p>
                    <div className="atencion-vista__pasos-guia">
                      {PASOS.map((paso) => (
                        <div key={paso.id} className="atencion-vista__paso-guia">
                          <span className="atencion-vista__paso-guia-num">{paso.id}</span>
                          {paso.etiqueta}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <nav className="atencion-vista__progreso" aria-label="Progreso de atención">
                      {PASOS.map((paso) => {
                        const completado = paso.id < pasoActual;
                        const activo = paso.id === pasoActual;
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
                          {iniciales(citaSeleccionada.cliente.nombre)}
                        </div>
                        <div className="atencion-vista__cliente-info">
                          <h2>{citaSeleccionada.cliente.nombre}</h2>
                          <p className="atencion-vista__cliente-servicio">
                            {citaSeleccionada.servicio.nombre}
                          </p>
                          <ul className="atencion-vista__cliente-detalles">
                            <li>
                              {formatearHoraLegible(citaSeleccionada.horaInicio)} —{' '}
                              {formatearHoraLegible(citaSeleccionada.horaFin)}
                            </li>
                            <li>{citaSeleccionada.cliente.telefono}</li>
                          </ul>
                        </div>
                      </div>

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
                      </div>

                      <div className="atencion-vista__bloque">
                        <div className="atencion-vista__bloque-cabecera">
                          <div>
                            <h3>Costos adicionales</h3>
                            <p className="atencion-vista__bloque-desc">
                              Uña fracturada, accesorios, retoques u otros cargos extra.
                            </p>
                          </div>
                        </div>

                        <div className="atencion-vista__sugerencias">
                          {EXTRAS_SUGERIDOS.map((s) => (
                            <button
                              key={s.concepto}
                              type="button"
                              className="atencion-vista__sugerencia"
                              onClick={() => agregarExtra(s)}
                            >
                              + {s.concepto}
                              <span className="atencion-vista__sugerencia-monto">
                                {formatearPrecio(s.monto)}
                              </span>
                            </button>
                          ))}
                        </div>

                        {extras.length > 0 && (
                          <div className="atencion-vista__extras-lista">
                            {extras.map((extra, indice) => (
                              <div key={indice} className="atencion-vista__extra-fila">
                                <label>
                                  Concepto
                                  <input
                                    type="text"
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
                          onClick={() => agregarExtra()}
                        >
                          + Agregar concepto manual
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
                            listoConfirmar ? 'atencion-vista__confirmar-aviso--listo' : ''
                          }`}
                        >
                          {listoConfirmar
                            ? 'Tiempo registrado. Puedes confirmar y facturar el servicio.'
                            : `Inicia el cronómetro y registra al menos ${MIN_SEGUNDOS_CRONOMETRO} segundos para continuar.`}
                        </p>
                        <BotonPrincipal
                          type="button"
                          anchoCompleto
                          deshabilitado={enviando || !listoConfirmar}
                          onClick={confirmarServicio}
                        >
                          {enviando ? 'Guardando…' : 'Confirmar servicio y facturar'}
                        </BotonPrincipal>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
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
    </div>
  );
}
