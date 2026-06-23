import { formatearHoraLegible } from '../../../modulos/reservas/utilidades/calendarioCliente';
import '../../../estilos/compartido/selector_hora/selector_hora.css';

export default function SelectorHora({ valor, onChange, opciones = [], etiqueta = 'Horarios disponibles' }) {
  if (opciones.length === 0) return null;

  return (
    <div className="selector-hora-grid">
      <span className="selector-hora-grid__etiqueta">{etiqueta}</span>
      <div className="selector-hora-grid__opciones" role="listbox" aria-label={etiqueta}>
        {opciones.map((hora) => {
          const activo = valor === hora;
          return (
            <button
              key={hora}
              type="button"
              role="option"
              aria-selected={activo}
              className={`selector-hora-grid__pill ${activo ? 'selector-hora-grid__pill--activo' : ''}`}
              onClick={() => onChange(hora)}
            >
              {formatearHoraLegible(hora)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
