import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../aplicacion/proveedores/ProveedorAuth';
import { BotonPrincipal, Cargando, EstadoCita } from '../../../compartido/componentes';
import IconoApp from '../../../compartido/componentes/icono_app/IconoApp';
import { RUTAS_ADMIN, RUTAS_PUBLICAS } from '../../../compartido/constantes';
import { fechaHoyLocal } from '../../../modulos/reservas/utilidades/calendarioCliente';
import { obtenerAgenda } from '../../../modulos/agenda/servicios/agendaServicio';
import '../../../estilos/admin/panel/panel.css';

const METRICAS = [
  { clave: 'total', etiqueta: 'Citas hoy', icono: 'agenda', tono: 'total' },
  { clave: 'pendientes', etiqueta: 'Pendientes', icono: 'atencion', tono: 'pendiente' },
  { clave: 'confirmadas', etiqueta: 'Confirmadas', icono: 'confirmada', tono: 'confirmada' },
];

const ACCESOS_RAPIDOS = [
  { to: RUTAS_ADMIN.agenda, etiqueta: 'Agenda', detalle: 'Ver calendario', icono: 'agenda' },
  { to: RUTAS_ADMIN.atencion, etiqueta: 'Atención', detalle: 'Iniciar servicio', icono: 'atencion' },
  { to: RUTAS_ADMIN.reportes, etiqueta: 'Reportes', detalle: 'Ingresos del mes', icono: 'reportes' },
  { to: RUTAS_ADMIN.carruselInicio, etiqueta: 'Carrusel', detalle: 'Editar inicio', icono: 'carrusel' },
  { to: RUTAS_ADMIN.galeria, etiqueta: 'Galería', detalle: 'Subir diseños', icono: 'galeria' },
  { to: RUTAS_ADMIN.configuracionGoogleCalendar, etiqueta: 'Google Calendar', detalle: 'Sincronizar citas', icono: 'agenda' },
  { to: RUTAS_ADMIN.configuracionMarca, etiqueta: 'Mi marca', detalle: 'Logo y colores', icono: 'config' },
];

function formatearFechaHoy() {
  return new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function obtenerSaludo() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function PanelVista() {
  const { usuario, marca } = useAuth();
  const [agenda, setAgenda] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerAgenda(fechaHoyLocal(), 'dia')
      .then(setAgenda)
      .catch(() => setAgenda(null))
      .finally(() => setCargando(false));
  }, []);

  const slug = marca?.slug;
  const proximas = agenda?.citas?.slice(0, 5) ?? [];
  const primerNombre = usuario?.nombre?.split(' ')[0] ?? 'equipo';

  return (
    <div className="panel-admin">
      <section className="panel-admin__hero">
        <div className="panel-admin__hero-texto">
          <p className="panel-admin__hero-etiqueta">{formatearFechaHoy()}</p>
          <h1>
            {obtenerSaludo()}, {primerNombre}
          </h1>
          <p className="panel-admin__hero-sub">
            Aquí tienes lo esencial de <strong>{marca?.nombreComercial}</strong> para hoy.
          </p>
        </div>
        <div className="panel-admin__hero-acciones">
          <BotonPrincipal to={RUTAS_ADMIN.agenda}>Nueva cita / Agenda</BotonPrincipal>
          {slug && (
            <a
              href={RUTAS_PUBLICAS.inicioMarca(slug)}
              className="panel-admin__hero-enlace"
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconoApp nombre="externo" />
              Vista previa app
            </a>
          )}
        </div>
      </section>

      <section className="panel-admin__metricas" aria-label="Indicadores del día">
        {METRICAS.map((metrica) => (
          <article
            key={metrica.clave}
            className={`panel-admin__metrica panel-admin__metrica--${metrica.tono}`}
          >
            <div className="panel-admin__metrica-icono">
              <IconoApp nombre={metrica.icono} />
            </div>
            <div>
              <span>{metrica.etiqueta}</span>
              <strong>{cargando ? '—' : agenda?.resumen?.[metrica.clave] ?? 0}</strong>
            </div>
          </article>
        ))}
      </section>

      <div className="panel-admin__bento">
        <section className="panel-admin__citas" aria-labelledby="panel-citas-titulo">
          <div className="panel-admin__seccion-cabecera">
            <div>
              <h2 id="panel-citas-titulo">Próximas citas</h2>
              <p>Lo que sigue en tu agenda de hoy</p>
            </div>
            <Link to={RUTAS_ADMIN.agenda} className="panel-admin__seccion-link">
              Ver agenda
              <IconoApp nombre="flecha" />
            </Link>
          </div>

          {cargando ? (
            <Cargando mensaje="Cargando citas…" />
          ) : proximas.length > 0 ? (
            <ul className="panel-admin__lista-citas">
              {proximas.map((cita) => (
                <li key={cita.id} className="panel-admin__cita">
                  <div className="panel-admin__cita-hora">
                    <strong>{cita.horaInicio}</strong>
                    <span>{cita.horaFin}</span>
                  </div>
                  <div className="panel-admin__cita-info">
                    <p className="panel-admin__cita-cliente">{cita.cliente.nombre}</p>
                    <p className="panel-admin__cita-servicio">{cita.servicio.nombre}</p>
                  </div>
                  <EstadoCita estado={cita.estado} canceladaPor={cita.canceladaPor} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="panel-admin__vacio">
              <div className="panel-admin__vacio-icono">
                <IconoApp nombre="agenda" />
              </div>
              <h3>Sin citas para hoy</h3>
              <p>Tu agenda está libre. Revisa el calendario o comparte tu enlace de reservas.</p>
              <BotonPrincipal to={RUTAS_ADMIN.agenda} variante="secundario">
                Ir a la agenda
              </BotonPrincipal>
            </div>
          )}
        </section>

        <aside className="panel-admin__accesos" aria-label="Accesos rápidos">
          <div className="panel-admin__seccion-cabecera panel-admin__seccion-cabecera--compacta">
            <div>
              <h2>Accesos rápidos</h2>
              <p>Lo que más usas, a un clic</p>
            </div>
          </div>
          <div className="panel-admin__accesos-grid">
            {ACCESOS_RAPIDOS.map((enlace) => (
              <Link key={enlace.to} to={enlace.to} className="panel-admin__acceso">
                <span className="panel-admin__acceso-icono">
                  <IconoApp nombre={enlace.icono} />
                </span>
                <span className="panel-admin__acceso-texto">
                  <strong>{enlace.etiqueta}</strong>
                  <span>{enlace.detalle}</span>
                </span>
                <IconoApp nombre="flecha" className="panel-admin__acceso-flecha" />
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
