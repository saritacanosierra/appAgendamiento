import { EstadoCita } from '../../../compartido/componentes';
import { formatearPrecio } from '../../../compartido/utilidades/temaMarca';
import DisenosGaleriaCita from '../disenos_galeria_cita/DisenosGaleriaCita';
import '../../../estilos/compartido/cita_en_curso/cita_en_curso.css';
import '../../../estilos/componentes/tarjeta_cita_admin/tarjeta_cita_admin.css';

export default function TarjetaCitaAdmin({ cita, enCurso = false, onConfirmar, onCancelar, onAtender }) {
  return (
    <article
      className={`tarjeta-cita-admin tarjeta-cita-admin--${cita.estado}${
        enCurso ? ' cita-en-curso' : ''
      }`}
    >
      <div className="tarjeta-cita-admin__hora">
        <strong>{cita.horaInicio}</strong>
        <span>{cita.horaFin}</span>
      </div>
      <div className="tarjeta-cita-admin__cuerpo">
        <h3>{cita.cliente.nombre}</h3>
        <p>{cita.servicio.nombre} · {formatearPrecio(cita.servicio.precio)}</p>
        <p className="tarjeta-cita-admin__tel">{cita.cliente.telefono}</p>
        <div className="tarjeta-cita-admin__estado-fila">
          <EstadoCita estado={cita.estado} canceladaPor={cita.canceladaPor} />
          {enCurso && <span className="cita-en-curso__etiqueta">En curso</span>}
        </div>
        {cita.notasInternas && (
          <p className="tarjeta-cita-admin__notas">{cita.notasInternas}</p>
        )}
        <DisenosGaleriaCita disenos={cita.disenosGaleria} variante="compacta" />
      </div>
      {cita.estado !== 'cancelada' && cita.estado !== 'completada' && (
        <div className="tarjeta-cita-admin__acciones">
          {onAtender && (
            <button
              type="button"
              className="tarjeta-cita-admin__atender"
              onClick={() => onAtender(cita)}
            >
              Atender ahora
            </button>
          )}
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
