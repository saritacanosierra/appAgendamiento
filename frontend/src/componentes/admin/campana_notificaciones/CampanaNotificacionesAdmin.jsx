import { useCallback, useEffect, useState } from 'react';
import { BotonPrincipal } from '../../../compartido/componentes';
import IconoApp from '../../../compartido/componentes/icono_app/IconoApp';
import { ModalPortal } from '../../../compartido/utilidades/modalPortal';
import {
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  obtenerResumenNotificaciones,
} from '../../../modulos/agenda/servicios/notificacionesServicio';
import '../../../estilos/componentes/campana_notificaciones/campana_notificaciones.css';

const EVENTO_ACTUALIZAR = 'spa-unas:notificaciones';

export function emitirActualizacionNotificaciones() {
  window.dispatchEvent(new Event(EVENTO_ACTUALIZAR));
}

function formatearHora(fechaIso) {
  if (!fechaIso) return '';
  return new Date(fechaIso).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CampanaNotificacionesAdmin() {
  const [abierto, setAbierto] = useState(false);
  const [resumen, setResumen] = useState({ noLeidas: 0, recientes: [] });
  const [cargando, setCargando] = useState(false);

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

  useEffect(() => {
    if (abierto) cargar();
  }, [abierto, cargar]);

  async function marcarLeida(id) {
    await marcarNotificacionLeida(id);
    cargar();
  }

  async function marcarTodas() {
    await marcarTodasNotificacionesLeidas();
    cargar();
  }

  return (
    <>
      <button
        type="button"
        className="campana-notificaciones"
        onClick={() => setAbierto(true)}
        aria-label={`Notificaciones${resumen.noLeidas ? `, ${resumen.noLeidas} sin leer` : ''}`}
      >
        <span className="campana-notificaciones__icono" aria-hidden="true">
          <IconoApp nombre="campana" tamano="md" />
        </span>
        {resumen.noLeidas > 0 && (
          <span className="campana-notificaciones__badge">{resumen.noLeidas}</span>
        )}
      </button>

      <ModalPortal abierto={abierto}>
        <div
          className="campana-notificaciones__modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-notificaciones-titulo"
        >
          <button
            type="button"
            className="campana-notificaciones__fondo"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar"
          />
          <div className="campana-notificaciones__panel">
            <header className="campana-notificaciones__cabecera">
              <h2 id="modal-notificaciones-titulo">Notificaciones</h2>
              <button
                type="button"
                className="campana-notificaciones__cerrar"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </header>

            {resumen.noLeidas > 0 && (
              <div className="campana-notificaciones__acciones-top">
                <BotonPrincipal variante="texto" onClick={marcarTodas}>
                  Marcar todas leidas
                </BotonPrincipal>
              </div>
            )}

            {cargando && (
              <p className="campana-notificaciones__vacio">Cargando...</p>
            )}

            {!cargando && resumen.recientes.length === 0 && (
              <p className="campana-notificaciones__vacio">No hay notificaciones recientes.</p>
            )}

            <ul className="campana-notificaciones__lista">
              {resumen.recientes.map((n) => (
                <li
                  key={n.id}
                  className={`campana-notificaciones__item ${n.leida ? '' : 'campana-notificaciones__item--nueva'}`}
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
          </div>
        </div>
      </ModalPortal>
    </>
  );
}
