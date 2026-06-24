import { BotonPrincipal } from '../../../compartido/componentes';
import { ModalPortal } from '../../../compartido/utilidades/modalPortal';
import { formatearHoraLegible } from '../../../modulos/reservas/utilidades/calendarioCliente';
import { formatearPrecio } from '../../../compartido/utilidades/temaMarca';
import DisenosGaleriaCita from '../../../componentes/admin/disenos_galeria_cita/DisenosGaleriaCita';
import '../../../estilos/admin/atencion/modal_resumen_atencion.css';

export default function ModalResumenAtencion({ cita, abierto, onCerrar }) {
  if (!abierto || !cita) return null;

  const facturacion = cita.facturacion ?? {};
  const precioBase = facturacion.precioBase ?? cita.servicio?.precio ?? 0;
  const precioAdicional = facturacion.precioAdicional ?? 0;
  const precioFinal = facturacion.precioFinal ?? precioBase + precioAdicional;
  const extras = facturacion.extras ?? [];

  return (
    <ModalPortal abierto={abierto}>
      <div
        className="modal-resumen-atencion"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-resumen-atencion-titulo"
      >
        <button
          type="button"
          className="modal-resumen-atencion__fondo"
          onClick={onCerrar}
          aria-label="Cerrar"
        />
        <div className="modal-resumen-atencion__contenido">
          <h2 id="modal-resumen-atencion-titulo">Resumen del servicio</h2>
          <p className="modal-resumen-atencion__subtitulo">
            {cita.cliente.nombre} · {formatearHoraLegible(cita.horaInicio)}
          </p>

          <dl className="modal-resumen-atencion__detalle">
            <div>
              <dt>Servicio</dt>
              <dd>{cita.servicio.nombre}</dd>
            </div>
            <div>
              <dt>Horario</dt>
              <dd>
                {formatearHoraLegible(cita.horaInicio)} — {formatearHoraLegible(cita.horaFin)}
              </dd>
            </div>
            {facturacion.duracionRealMinutos != null && (
              <div>
                <dt>Duracion real</dt>
                <dd>{facturacion.duracionRealMinutos} min</dd>
              </div>
            )}
            <div>
              <dt>Precio base</dt>
              <dd>{formatearPrecio(precioBase)}</dd>
            </div>
            {precioAdicional > 0 && (
              <div className="modal-resumen-atencion__adicionales">
                <dt>Adicionales</dt>
                <dd>
                  {extras.length > 0 ? (
                    <ul>
                      {extras.map((extra, indice) => (
                        <li key={`${extra.concepto}-${indice}`}>
                          <span>{extra.concepto}</span>
                          <strong>{formatearPrecio(extra.monto)}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    formatearPrecio(precioAdicional)
                  )}
                </dd>
              </div>
            )}
            <div className="modal-resumen-atencion__total">
              <dt>Total facturado</dt>
              <dd>{formatearPrecio(precioFinal)}</dd>
            </div>
            {cita.notasInternas && (
              <div>
                <dt>Notas internas</dt>
                <dd>{cita.notasInternas}</dd>
              </div>
            )}
          </dl>

          <DisenosGaleriaCita disenos={cita.disenosGaleria} variante="panel" />

          <BotonPrincipal onClick={onCerrar} anchoCompleto>
            Cerrar
          </BotonPrincipal>
        </div>
      </div>
    </ModalPortal>
  );
}
