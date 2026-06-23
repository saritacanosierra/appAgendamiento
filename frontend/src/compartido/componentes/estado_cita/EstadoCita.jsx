import { ESTADOS_CITA } from '../../constantes';
import '../../../estilos/compartido/estado_cita/estado_cita.css';

const CLASES_ESTADO = {
  pendiente: 'estado-cita--pendiente',
  confirmada: 'estado-cita--confirmada',
  cancelada: 'estado-cita--cancelada',
  completada: 'estado-cita--completada',
};

export default function EstadoCita({ estado }) {
  const etiqueta = ESTADOS_CITA[estado] || estado;
  const clase = CLASES_ESTADO[estado] || '';

  return <span className={`estado-cita ${clase}`}>{etiqueta}</span>;
}
