import IconoApp from '../../../compartido/componentes/icono_app/IconoApp';
import { EstadoCita } from '../../../compartido/componentes';
import { formatearHoraLegible } from '../../../modulos/reservas/utilidades/calendarioCliente';
import { formatearPrecio } from '../../../compartido/utilidades/temaMarca';
import { citaPermiteEstadoEnCurso } from '../../../modulos/atencion/hooks/useCronometro';

export default function ColaCitasAtencion({
  datos,
  citaSeleccionada,
  cronometro,
  mostrarAtendidas,
  onToggleAtendidas,
  onVerResumen,
  onSeleccionarCita,
  renderPanelAtencion,
}) {
  return (
    <section className="atencion-vista__cola" aria-label="Cola de citas">
      {datos?.atendidas?.length > 0 && (
        <div className="atencion-vista__atendidas">
          <button
            type="button"
            className="atencion-vista__atendidas-toggle"
            onClick={onToggleAtendidas}
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
                    onClick={() => onVerResumen(cita)}
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
          <span className="atencion-vista__vacio-icono" aria-hidden="true">
            <IconoApp nombre="citas" tamano="lg" />
          </span>
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
                    onClick={() => onSeleccionarCita(cita)}
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
  );
}
