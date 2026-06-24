
import '../../../estilos/compartido/campo_formulario/campo_formulario.css';
export default function CampoFormulario({
  etiqueta,
  id,
  error,
  ayuda,
  children,
  requerido = false,
}) {
  return (
    <div className={`campo-formulario ${error ? 'campo-formulario--error' : ''}`}>
      {etiqueta && (
        <label htmlFor={id}>
          {etiqueta}
          {requerido && <span aria-hidden="true"> *</span>}
        </label>
      )}
      {children}
      {ayuda && !error && <span className="campo-formulario__ayuda">{ayuda}</span>}
      {error && <span className="campo-formulario__error">{error}</span>}
    </div>
  );
}
