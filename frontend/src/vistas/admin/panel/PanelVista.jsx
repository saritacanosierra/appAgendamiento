import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../aplicacion/proveedores/ProveedorAuth';
import { BotonPrincipal, Cargando, EstadoCita } from '../../../compartido/componentes';
import IconoApp from '../../../compartido/componentes/icono_app/IconoApp';
import { RUTAS_ADMIN, RUTAS_PUBLICAS } from '../../../compartido/constantes';
import { fechaHoyLocal } from '../../../modulos/reservas/utilidades/calendarioCliente';
import { obtenerAgenda } from '../../../modulos/agenda/servicios/agendaServicio';
import { obtenerPuestaEnMarcha, obtenerPoliticaPrivacidad } from '../../../modulos/configuracion_marca/servicios/configuracionServicio';
import BienvenidaMarca from '../../../componentes/admin/bienvenida_marca/BienvenidaMarca';
import EnlaceAgendaMarca from '../../../componentes/admin/enlace_agenda/EnlaceAgendaMarca';
import GuiaPersonalizacion, {
  claveGuiaTienda,
  guiaTiendaOculta,
} from '../../../componentes/admin/guia_personalizacion/GuiaPersonalizacion';
import PagoPlanMarca from '../../../componentes/admin/pago_plan/PagoPlanMarca';
import '../../../estilos/admin/panel/panel.css';

const METRICAS = [
  { clave: 'total', etiqueta: 'Citas hoy', icono: 'agenda', tono: 'total' },
  { clave: 'pendientes', etiqueta: 'Pendientes', icono: 'atencion', tono: 'pendiente' },
  { clave: 'confirmadas', etiqueta: 'Confirmadas', icono: 'confirmada', tono: 'confirmada' },
];

function formatearFechaHoy() {
  return new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function PanelVista() {
  const { usuario, marca } = useAuth();
  const [agenda, setAgenda] = useState(null);
  const [sinServicios, setSinServicios] = useState(false);
  const [hechos, setHechos] = useState({});
  const [verPanel, setVerPanel] = useState(false);
  const [guiaVisible, setGuiaVisible] = useState(true);
  const [politicaAceptada, setPoliticaAceptada] = useState(true);
  const [cargando, setCargando] = useState(true);

  const marcaId = marca?.id ?? usuario?.marcaId;

  useEffect(() => {
    setGuiaVisible(!guiaTiendaOculta(marcaId));
  }, [marcaId]);

  useEffect(() => {
    if (!marcaId) return undefined;
    let vigente = true;
    setCargando(true);
    Promise.all([
      obtenerAgenda(fechaHoyLocal(), 'dia').catch(() => null),
      obtenerPuestaEnMarcha().catch(() => null),
      usuario?.rol === 'admin' ? obtenerPoliticaPrivacidad().catch(() => null) : Promise.resolve(null),
    ])
      .then(([agendaDia, resumen, politica]) => {
        if (!vigente) return;
        setAgenda(agendaDia);
        if (politica) setPoliticaAceptada(Boolean(politica.aceptada));
        if (!resumen) return;
        setSinServicios(resumen.cantidadServicios === 0);
        setHechos({
          marca: Boolean(resumen.marca),
          servicios: Boolean(resumen.servicios),
          equipo: Boolean(resumen.equipo),
          galeria: Boolean(resumen.galeria),
        });
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [marcaId, usuario?.rol]);

  function ocultarGuia() {
    if (marcaId) {
      try {
        localStorage.setItem(claveGuiaTienda(marcaId), 'oculta');
      } catch {
        /* El panel sigue usable si el navegador bloquea el almacenamiento. */
      }
    }
    setGuiaVisible(false);
  }

  function mostrarGuia() {
    if (marcaId) {
      try {
        localStorage.removeItem(claveGuiaTienda(marcaId));
      } catch {
        /* Si no se puede borrar, la guía igual se muestra en esta visita. */
      }
    }
    setGuiaVisible(true);
  }

  const slug = marca?.slug;
  const proximas = agenda?.citas?.slice(0, 5) ?? [];
  const marcaNueva = sinServicios;
  const tiendaLista = Boolean(hechos.marca && hechos.servicios && hechos.equipo && hechos.galeria);

  if (cargando) return <Cargando mensaje="Preparando tu espacio..." />;

  const avisoPolitica = usuario?.rol === 'admin' && !politicaAceptada ? (
    <Link className="panel-admin__politica" to={`${RUTAS_PUBLICAS.usoDatos}?volver=${encodeURIComponent(RUTAS_ADMIN.panel)}`}>
      Falta marcar de acuerdo la política de privacidad. Ábrela y acepta para dejar constancia.
    </Link>
  ) : null;

  if (marcaNueva && !verPanel) {
    return (
      <div className="panel-admin">
        {avisoPolitica}
        {slug && <EnlaceAgendaMarca slug={slug} nombre={marca?.nombreComercial} />}
        {(marca?.plan?.prueba || marca?.plan?.porVencer) && <PagoPlanMarca variante="aviso" />}
        <BienvenidaMarca marca={marca} hechos={hechos} onVerPanel={() => setVerPanel(true)} />
      </div>
    );
  }

  return (
    <div className="panel-admin">
      {avisoPolitica}
      {slug && <EnlaceAgendaMarca slug={slug} nombre={marca?.nombreComercial} />}
      {(marca?.plan?.prueba || marca?.plan?.porVencer) && <PagoPlanMarca variante="aviso" />}
      {!tiendaLista && (
        guiaVisible ? (
          <GuiaPersonalizacion hechos={hechos} onOcultar={ocultarGuia} />
        ) : (
          <button type="button" className="panel-admin__ver-guia" onClick={mostrarGuia}>
            Ver los pasos para personalizar tu tienda
          </button>
        )
      )}

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
              <h2 id="panel-citas-titulo">Hoy</h2>
              <p>{formatearFechaHoy()}</p>
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
              <p>No hay citas en el día.</p>
              <BotonPrincipal to={RUTAS_ADMIN.agenda} variante="secundario">
                Ir a la agenda
              </BotonPrincipal>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
