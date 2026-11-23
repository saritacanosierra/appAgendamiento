import { useState } from 'react';
import IconoApp from '../icono_app/IconoApp';
import '../../../estilos/compartido/campo_contrasena/campo_contrasena.css';

export default function CampoContrasena({
  id,
  value,
  onChange,
  placeholder = 'Escribe tu contraseña',
  autoComplete = 'current-password',
  className = '',
  ...props
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`campo-contrasena ${className}`.trim()}>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        {...props}
      />
      <button
        type="button"
        className="campo-contrasena__ojito"
        onClick={() => setVisible((actual) => !actual)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
      >
        <IconoApp nombre={visible ? 'ojo-cerrado' : 'ojo'} />
      </button>
    </div>
  );
}
