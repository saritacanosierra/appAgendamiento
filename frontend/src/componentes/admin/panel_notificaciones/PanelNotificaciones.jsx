import { useCallback, useEffect, useState } from 'react';
import { BotonPrincipal } from '../../../compartido/componentes';
import {
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  obtenerResumenNotificaciones,
} from '../../../modulos/agenda/servicios/notificacionesServicio';
import { emitirActualizacionNotificaciones } from '../campana_notificaciones/CampanaNotificacionesAdmin';
import '../../../estilos/componentes/panel_notificaciones/panel_notificaciones.css';

const EVENTO_ACTUALIZAR = 'spa-unas:notificaciones';

function formatearHora(fechaIso) {
  if (!fechaIso) return '';
  return new Date(fechaIso).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PanelNotificaciones() {
  const [resumen, setResumen] = useState({ noLeidas: 0, recientes: [] });
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setResumen(await obtenerResumenNotificaciones());
    } catch {
      setResumen({ noLeidas: 0, recientes: [] });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, 30_000);
    const escuchar = () => cargar();
    window.addEventListener(EVENTO_ACTUALIZAR, escuchar);
    return () => {
      clearInterval(intervalo);
      window.removeEventListener(EVENTO_ACTUALIZAR, escuchar);
    };
  }, [cargar]);

  async function marcarLeida(id) {
    await marcarNotificacionLeida(id);
    cargar();
    emitirActualizacionNotificaciones();
  }

  async function marcarTodas() {
    await marcarTodasNotificacionesLeidas();
    cargar();
    emitirActualizacionNotificaciones();
  }

  return (
    <section className="panel-notificaciones">
      <header className="panel-notificaciones__cabecera">
        <h2>
          Notificaciones
          {resumen.noLeidas > 0 && (
            <span className="panel-notificaciones__badge">{resumen.noLeidas}</span>
          )}
        </h2>
        {resumen.noLeidas > 0 && (
          <BotonPrincipal variante="texto" onClick={marcarTodas}>
            Marcar todas leidas
          </BotonPrincipal>
        )}
      </header>

      {cargando && <p className="panel-notificaciones__cargando">Cargando...</p>}

      {!cargando && resumen.recientes.length === 0 && (
        <p className="panel-notificaciones__vacio">No hay notificaciones recientes.</p>
      )}

      <ul className="panel-notificaciones__lista">
        {resumen.recientes.map((n) => (
          <li
            key={n.id}
            className={`panel-notificaciones__item ${n.leida ? '' : 'panel-notificaciones__item--nueva'}`}
          >
            <div>
              <strong>{n.titulo}</strong>
              <p>{n.mensaje}</p>
              <time>{formatearHora(n.createdAt)}</time>
            </div>
            {!n.leida && (
              <BotonPrincipal variante="secundario" onClick={() => marcarLeida(n.id)}>
                Leida
              </BotonPrincipal>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
