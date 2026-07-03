import { useVisorImagen } from '../../../aplicacion/proveedores/ProveedorVisorImagen';
import { resolverUrlMedia } from '../../utilidades/resolverUrlMedia';
import '../../../estilos/compartido/imagen_ampliable/imagen_ampliable.css';

export default function ImagenAmpliable({
  src,
  alt = '',
  className = '',
  deshabilitado = false,
  onClick,
  ...rest
}) {
  const { abrirImagen } = useVisorImagen();

  if (!src) return null;

  const url = resolverUrlMedia(src);

  function manejarClick(e) {
    onClick?.(e);
    if (deshabilitado || e.defaultPrevented) return;
    e.stopPropagation();
    abrirImagen({ src: url, alt });
  }

  const clases = ['imagen-ampliable', className].filter(Boolean).join(' ');

  return (
    <img
      src={url}
      alt={alt}
      className={clases}
      onClick={manejarClick}
      {...rest}
    />
  );
}
