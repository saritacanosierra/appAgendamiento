import { Link } from 'react-router-dom';
import '../../../estilos/compartido/boton_principal/boton_principal.css';

export default function BotonPrincipal({
  children,
  tipo = 'button',
  type,
  variante = 'principal',
  anchoCompleto = false,
  deshabilitado = false,
  onClick,
  href,
  to,
  className = '',
}) {
  const tipoBoton = type ?? tipo;
  const clases = [
    'boton-principal',
    `boton-principal--${variante}`,
    anchoCompleto ? 'boton-principal--completo' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (to) {
    return (
      <Link className={clases} to={to}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a className={clases} href={href}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={tipoBoton}
      className={clases}
      disabled={deshabilitado}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
