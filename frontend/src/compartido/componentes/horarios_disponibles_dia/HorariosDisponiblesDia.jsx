import { useEffect, useMemo, useState } from 'react';
import Cargando from '../cargando/Cargando';
import { obtenerDisponibilidad } from '../../../modulos/reservas/servicios/reservasServicio';
import {
  fechaHoyLocal,
  formatearFechaLegible,
  formatearHoraLegible,
  generarRangoDias,
  sumarDias,
} from '../../../modulos/reservas/utilidades/calendarioCliente';
import '../../../estilos/compartido/horarios_disponibles_dia/horarios_disponibles_dia.css';

export default function HorariosDisponiblesDia({
  marcaId,
  servicios = [],
  onElegirHorario,
}) {
  const hoy = fechaHoyLocal();
  const [fecha, setFecha] = useState(hoy);
  const [servicioId, setServicioId] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const franjaDias = useMemo(() => generarRangoDias(hoy, 14), [hoy]);
  const servicioActivo = servicios.find((s) => s.id === servicioId) ?? null;
  const puedeRetroceder = fecha > hoy;

  useEffect(() => {
    if (servicios.length === 0) {
      setServicioId(null);
      return;
    }
    if (!servicioId || !servicios.some((s) => s.id === servicioId)) {
      setServicioId(servicios[0].id);
    }
  }, [servicios, servicioId]);

  useEffect(() => {
    if (!marcaId || !servicioId || !fecha) {
      setHorarios([]);
      return;
    }

    setCargando(true);
    setMensaje('');
    obtenerDisponibilidad(marcaId, servicioId, fecha)
      .then((datos) => {
        setHorarios(datos.horarios ?? []);
        setMensaje(datos.mensaje ?? '');
      })
      .catch(() => {
        setHorarios([]);
        setMensaje('No se pudieron cargar los horarios.');
      })
      .finally(() => setCargando(false));
  }, [marcaId, servicioId, fecha]);

  if (servicios.length === 0) return null;

  return (
    <section className="horarios-dia" aria-label="Horarios disponibles">
      <div className="horarios-dia__cabecera">
        <h2>Horarios disponibles</h2>
        <p className="horarios-dia__fecha-activa">{formatearFechaLegible(fecha)}</p>
      </div>

      <div className="horarios-dia__nav-fecha">
        <button
          type="button"
          className="horarios-dia__flecha"
          onClick={() => setFecha(sumarDias(fecha, -1))}
          disabled={!puedeRetroceder}
          aria-label="Dia anterior"
        >
          ‹
        </button>

        <div className="horarios-dia__franja" role="tablist" aria-label="Elegir dia">
          {franjaDias.map((dia) => (
            <button
              key={dia.fecha}
              type="button"
              role="tab"
              aria-selected={fecha === dia.fecha}
              className={[
                'horarios-dia__dia',
                fecha === dia.fecha ? 'horarios-dia__dia--activo' : '',
                dia.esHoy ? 'horarios-dia__dia--hoy' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setFecha(dia.fecha)}
            >
              <span>{dia.diaSemana}</span>
              <strong>{dia.numero}</strong>
              {dia.esHoy && <em>Hoy</em>}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="horarios-dia__flecha"
          onClick={() => setFecha(sumarDias(fecha, 1))}
          aria-label="Dia siguiente"
        >
          ›
        </button>
      </div>

      {servicios.length > 1 && (
        <div className="horarios-dia__servicios" role="tablist" aria-label="Servicio">
          {servicios.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={servicioId === s.id}
              className={`horarios-dia__servicio-tab ${servicioId === s.id ? 'horarios-dia__servicio-tab--activo' : ''}`}
              onClick={() => setServicioId(s.id)}
            >
              {s.nombre}
            </button>
          ))}
        </div>
      )}

      {servicioActivo && servicios.length === 1 && (
        <p className="horarios-dia__servicio-unico">{servicioActivo.nombre}</p>
      )}

      {cargando && <Cargando mensaje="Buscando horarios..." />}

      {!cargando && horarios.length === 0 && (
        <p className="horarios-dia__vacio">
          {mensaje || 'No hay horarios disponibles este dia.'}
        </p>
      )}

      {!cargando && horarios.length > 0 && (
        <div className="horarios-dia__grid" role="listbox" aria-label="Horarios">
          {horarios.map((hora) => (
            <button
              key={hora}
              type="button"
              role="option"
              className="horarios-dia__hora"
              onClick={() => onElegirHorario?.(servicioActivo, fecha, hora)}
            >
              {formatearHoraLegible(hora)}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
