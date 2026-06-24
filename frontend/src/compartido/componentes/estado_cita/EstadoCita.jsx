import { CANCELADA_POR_ETIQUETAS, ESTADOS_CITA } from '../../constantes';
import '../../../estilos/compartido/estado_cita/estado_cita.css';

const CLASES_ESTADO = {
  pendiente: 'estado-cita--pendiente',
  confirmada: 'estado-cita--confirmada',
  cancelada: 'estado-cita--cancelada',
  completada: 'estado-cita--completada',
};

function etiquetaEstado(estado, canceladaPor) {
  if (estado !== 'cancelada') {
    return ESTADOS_CITA[estado] || estado;
  }

  const base = ESTADOS_CITA.cancelada;
  const origen = CANCELADA_POR_ETIQUETAS[canceladaPor];
  return origen ? `${base} · ${origen}` : base;
}

export default function EstadoCita({ estado, canceladaPor }) {
  const etiqueta = etiquetaEstado(estado, canceladaPor);
  const clase = CLASES_ESTADO[estado] || '';

  return (
    <span className={`estado-cita ${clase}`} title={etiqueta}>
      {etiqueta}
    </span>
  );
}
