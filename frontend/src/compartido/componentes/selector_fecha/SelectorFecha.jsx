import CampoFormulario from '../campo_formulario/CampoFormulario';
import '../../../estilos/compartido/selector_fecha/selector_fecha.css';

export default function SelectorFecha({ valor, onChange, min, etiqueta = 'Fecha' }) {
  return (
    <CampoFormulario etiqueta={etiqueta} id="selector-fecha">
      <input
        id="selector-fecha"
        type="date"
        className="selector-fecha"
        value={valor}
        min={min}
        onChange={(e) => onChange(e.target.value)}
      />
    </CampoFormulario>
  );
}
