import { aplicarCapitalizacion } from '../../utilidades/capitalizarTexto';

export default function TextareaTexto({
  capitalizar = 'inicio',
  onChange,
  ...props
}) {
  const debeCapitalizar = capitalizar !== false && !props.readOnly && !props.disabled;

  function manejarChange(evento) {
    if (!onChange) return;

    if (!debeCapitalizar) {
      onChange(evento);
      return;
    }

    const valor = aplicarCapitalizacion(evento.target.value, capitalizar);
    if (valor === evento.target.value) {
      onChange(evento);
      return;
    }

    onChange({
      ...evento,
      target: { ...evento.target, value: valor },
      currentTarget: { ...evento.currentTarget, value: valor },
    });
  }

  return <textarea onChange={manejarChange} {...props} />;
}
