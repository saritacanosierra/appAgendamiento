import { aplicarCapitalizacion } from '../../utilidades/capitalizarTexto';

const TIPOS_SIN_CAPITALIZAR = new Set([
  'email',
  'password',
  'number',
  'tel',
  'url',
  'search',
  'date',
  'time',
  'datetime-local',
  'month',
  'week',
  'file',
  'hidden',
  'checkbox',
  'radio',
  'range',
  'color',
]);

export default function InputTexto({
  capitalizar = 'inicio',
  onChange,
  type = 'text',
  ...props
}) {
  const debeCapitalizar = capitalizar !== false
    && !TIPOS_SIN_CAPITALIZAR.has(type)
    && !props.readOnly
    && !props.disabled;

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

  return <input type={type} onChange={manejarChange} {...props} />;
}
