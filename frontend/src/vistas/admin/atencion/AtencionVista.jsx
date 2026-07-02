import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BotonPrincipal,
  Cargando,
  MensajeError,
  ModalMensaje,
  SelectorFecha,
} from '../../../compartido/componentes';
import IconoApp from '../../../compartido/componentes/icono_app/IconoApp';
import ColaCitasAtencion from '../../../componentes/admin/atencion/ColaCitasAtencion';
import PanelAtencionCita from '../../../componentes/admin/atencion/PanelAtencionCita';
import ResumenDiaAtencion from '../../../componentes/admin/atencion/ResumenDiaAtencion';
import { fechaHoyLocal } from '../../../modulos/reservas/utilidades/calendarioCliente';
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
import {
  MIN_SEGUNDOS_CRONOMETRO,
  extraDesdeServicio,
  extraVacio,
  mensajeConfirmacionAtencion,
  prepararExtrasParaApi,
} from '../../../modulos/atencion/utilidades/atencionUtilidades';
import { mensajeErrorPanelAdmin } from '../../../compartido/utilidades/erroresAdmin';
import ModalResumenAtencion from './ModalResumenAtencion';
import '../../../estilos/admin/atencion/atencion.css';

export default function AtencionVista() {
  const [searchParams, setSearchParams] = useSearchParams();
  const citaParam = searchParams.get('cita');
  const fechaParam = searchParams.get('fecha');
  const autoIniciarRef = useRef(false);
  const citaPreseleccionadaRef = useRef(null);
  const editandoTiempoRef = useRef(false);

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

  const cronometro = useCronometro(citaSeleccionada?.id);
  const { iniciar: iniciarCronometro } = cronometro;

  const hoy = fechaHoyLocal();
  const progresoAnillo = `${Math.min(100, (cronometro.segundos / 3600) * 100)}%`;
  const cronometroPausado = !cronometro.activo && cronometro.segundos > 0;
  const precioBase = citaSeleccionada?.servicio?.precio ?? 0;
  const extrasManuales = extras.filter((extra) => !extra.servicioId);
  const totalExtras = extras.reduce((sum, e) => sum + (Number(e.monto) || 0), 0);
  const precioTotal = precioBase + totalExtras;

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

  function renderPanelAtencion(cita) {
    return (
      <PanelAtencionCita
        cita={cita}
        cronometro={cronometro}
        progresoAnillo={progresoAnillo}
        cronometroPausado={cronometroPausado}
        tiempoManual={tiempoManual}
        errorTiempoManual={errorTiempoManual}
        serviciosAdicionales={serviciosAdicionales}
        extras={extras}
        extrasManuales={extrasManuales}
        precioBase={precioBase}
        totalExtras={totalExtras}
        precioTotal={precioTotal}
        notas={notas}
        enviando={enviando}
        onTiempoManualFocus={() => {
          editandoTiempoRef.current = true;
        }}
        onTiempoManualChange={(e) => {
          setTiempoManual(e.target.value);
          setErrorTiempoManual(null);
        }}
        onAplicarTiempoManual={aplicarTiempoManual}
        onToggleExtraServicio={toggleExtraServicio}
        onAgregarExtraManual={agregarExtraManual}
        onActualizarExtra={actualizarExtra}
        onQuitarExtra={quitarExtra}
        onNotasChange={(e) => setNotas(e.target.value)}
        onConfirmarServicio={confirmarServicio}
      />
    );
  }

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
              <IconoApp nombre="actualizar" tamano="sm" />
            </span>
          </BotonPrincipal>
        </div>
      </header>

      {error && <MensajeError mensaje={error} />}

      {datos && <ResumenDiaAtencion resumen={datos.resumen} />}

      {cargando && !datos ? (
        <Cargando mensaje="Cargando citas del día…" />
      ) : (
        <div className="atencion-vista__layout">
          <ColaCitasAtencion
            datos={datos}
            citaSeleccionada={citaSeleccionada}
            cronometro={cronometro}
            mostrarAtendidas={mostrarAtendidas}
            onToggleAtendidas={() => setMostrarAtendidas((v) => !v)}
            onVerResumen={setCitaResumen}
            onSeleccionarCita={seleccionarCita}
            renderPanelAtencion={renderPanelAtencion}
          />
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
