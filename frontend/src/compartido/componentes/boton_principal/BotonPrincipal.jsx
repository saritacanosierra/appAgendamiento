
import '../../../estilos/compartido/boton_principal/boton_principal.css';
export default function BotonPrincipal({
  children,
  tipo = 'button',
  variante = 'principal',
  anchoCompleto = false,
  deshabilitado = false,
  onClick,
  href,
}) {
  const clases = [
    'boton-principal',
    `boton-principal--${variante}`,
    anchoCompleto ? 'boton-principal--completo' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (href) {
    return (
      <a className={clases} href={href}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={tipo}
      className={clases}
      disabled={deshabilitado}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
