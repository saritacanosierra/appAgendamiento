import CampoFormulario from '../campo_formulario/CampoFormulario';
import '../../../estilos/compartido/selector_hora/selector_hora.css';

export default function SelectorHora({ valor, onChange, opciones = [], etiqueta = 'Hora' }) {
  return (
    <CampoFormulario etiqueta={etiqueta} id="selector-hora">
      <select
        id="selector-hora"
        className="selector-hora"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Selecciona una hora</option>
        {opciones.map((hora) => (
          <option key={hora} value={hora}>
            {hora}
          </option>
        ))}
      </select>
    </CampoFormulario>
  );
}
