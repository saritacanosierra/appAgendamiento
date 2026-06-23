
import '../../../estilos/compartido/mensaje_error/mensaje_error.css';
export default function MensajeError({ titulo = 'Ocurrio un error', mensaje, onReintentar }) {
  return (
    <div className="mensaje-error" role="alert">
      <h2>{titulo}</h2>
      {mensaje && <p>{mensaje}</p>}
      {onReintentar && (
        <button type="button" className="mensaje-error__reintentar" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  );
}
