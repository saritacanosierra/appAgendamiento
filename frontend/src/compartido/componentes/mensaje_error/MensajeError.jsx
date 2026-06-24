
import '../../../estilos/compartido/mensaje_error/mensaje_error.css';
export default function MensajeError({
  titulo = 'Ocurrio un error',
  mensaje,
  detalles,
  onReintentar,
  suave = false,
}) {
  const lista = Array.isArray(detalles) ? detalles.filter(Boolean) : [];

  return (
    <div
      className={`mensaje-error${suave ? ' mensaje-error--suave' : ''}`}
      role={suave ? 'status' : 'alert'}
    >
      <h2>{titulo}</h2>
      {mensaje && <p>{mensaje}</p>}
      {lista.length > 0 && (
        <ul className="mensaje-error__detalles">
          {lista.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {onReintentar && (
        <button type="button" className="mensaje-error__reintentar" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  );
}
