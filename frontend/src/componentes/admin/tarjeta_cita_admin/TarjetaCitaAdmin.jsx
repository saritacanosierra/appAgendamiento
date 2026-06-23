import { EstadoCita } from '../../../compartido/componentes';
import { formatearPrecio } from '../../../compartido/utilidades/temaMarca';
import '../../../estilos/componentes/tarjeta_cita_admin/tarjeta_cita_admin.css';

export default function TarjetaCitaAdmin({ cita, onConfirmar, onCancelar }) {
  return (
    <article className={`tarjeta-cita-admin tarjeta-cita-admin--${cita.estado}`}>
      <div className="tarjeta-cita-admin__hora">
        <strong>{cita.horaInicio}</strong>
        <span>{cita.horaFin}</span>
      </div>
      <div className="tarjeta-cita-admin__cuerpo">
        <h3>{cita.cliente.nombre}</h3>
        <p>{cita.servicio.nombre} · {formatearPrecio(cita.servicio.precio)}</p>
        <p className="tarjeta-cita-admin__tel">{cita.cliente.telefono}</p>
        <EstadoCita estado={cita.estado} />
        {cita.notasInternas && (
          <p className="tarjeta-cita-admin__notas">{cita.notasInternas}</p>
        )}
      </div>
      {cita.estado !== 'cancelada' && cita.estado !== 'completada' && (
        <div className="tarjeta-cita-admin__acciones">
          {cita.estado === 'pendiente' && onConfirmar && (
            <button type="button" onClick={() => onConfirmar(cita)}>
              Confirmar
            </button>
          )}
          {onCancelar && (
            <button type="button" className="tarjeta-cita-admin__cancelar" onClick={() => onCancelar(cita)}>
              Cancelar
            </button>
          )}
        </div>
      )}
    </article>
  );
}
