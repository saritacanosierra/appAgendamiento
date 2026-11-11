import '../../../estilos/componentes/estado_vacio/estado_vacio.css';

export default function EstadoVacio({
  titulo,
  mensaje,
  textoAccion,
  onAccion,
}) {
  return (
    <div className="estado-vacio">
      <svg className="estado-vacio__dibujo" viewBox="0 0 120 88" aria-hidden="true">
        <rect x="18" y="16" width="84" height="60" rx="12" />
        <path d="M36 40h48M36 52h32" />
        <circle cx="86" cy="24" r="10" />
      </svg>
      <h2>{titulo}</h2>
      <p>{mensaje}</p>
      {textoAccion && onAccion && (
        <button type="button" className="estado-vacio__accion" onClick={onAccion}>
          {textoAccion}
        </button>
      )}
    </div>
  );
}
