import { Link } from 'react-router-dom';
import { BotonPrincipal, InputTexto } from '../../../compartido/componentes';
import { formatearHoraLegible } from '../../../modulos/reservas/utilidades/calendarioCliente';
import { formatearPrecio } from '../../../compartido/utilidades/temaMarca';
import { RUTAS_ADMIN } from '../../../compartido/constantes';
import DisenosGaleriaCita from '../disenos_galeria_cita/DisenosGaleriaCita';
import {
  MIN_SEGUNDOS_CRONOMETRO,
  PASOS_ATENCION,
  etiquetaEstadoCronometro,
  inicialesCliente,
  pasoActivoAtencion,
} from '../../../modulos/atencion/utilidades/atencionUtilidades';

export default function PanelAtencionCita({
  cita,
  cronometro,
  progresoAnillo,
  cronometroPausado,
  tiempoManual,
  errorTiempoManual,
  serviciosAdicionales,
  extras,
  extrasManuales,
  precioBase,
  totalExtras,
  precioTotal,
  notas,
  enviando,
  onTiempoManualFocus,
  onTiempoManualChange,
  onAplicarTiempoManual,
  onToggleExtraServicio,
  onAgregarExtraManual,
  onActualizarExtra,
  onQuitarExtra,
  onNotasChange,
  onConfirmarServicio,
}) {
  const pasoActualCita = pasoActivoAtencion(cita, cronometro.segundos);
  const listoConfirmarCita = cronometro.segundos >= MIN_SEGUNDOS_CRONOMETRO;

  return (
    <>
      <nav className="atencion-vista__progreso" aria-label="Progreso de atención">
        {PASOS_ATENCION.map((paso) => {
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
            {inicialesCliente(cita.cliente.nombre)}
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
                {etiquetaEstadoCronometro(cronometro.activo, cronometro.segundos)}
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
                  onFocus={onTiempoManualFocus}
                  onChange={onTiempoManualChange}
                  onBlur={onAplicarTiempoManual}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onAplicarTiempoManual();
                      e.currentTarget.blur();
                    }
                  }}
                />
                <button
                  type="button"
                  className="atencion-vista__tiempo-manual-aplicar"
                  onClick={onAplicarTiempoManual}
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
                    onClick={() => onToggleExtraServicio(servicio)}
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
                      onChange={(e) => onActualizarExtra(indice, 'concepto', e.target.value)}
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
                      onChange={(e) => onActualizarExtra(indice, 'monto', e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="atencion-vista__extra-quitar"
                    onClick={() => onQuitarExtra(indice)}
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
            onClick={onAgregarExtraManual}
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
            onChange={onNotasChange}
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
            onClick={onConfirmarServicio}
          >
            {enviando ? 'Guardando…' : 'Confirmar servicio y facturar'}
          </BotonPrincipal>
        </div>
      </div>
    </>
  );
}
