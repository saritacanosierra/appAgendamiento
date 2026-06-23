
import '../../../estilos/compartido/campo_formulario/campo_formulario.css';
export default function CampoFormulario({
  etiqueta,
  id,
  error,
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
      {error && <span className="campo-formulario__error">{error}</span>}
    </div>
  );
}
