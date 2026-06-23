
import '../../../estilos/compartido/cargando/cargando.css';
export default function Cargando({ mensaje = 'Cargando...' }) {
  return (
    <div className="cargando" role="status" aria-live="polite">
      <div className="cargando__spinner" aria-hidden="true" />
      <p>{mensaje}</p>
    </div>
  );
}
