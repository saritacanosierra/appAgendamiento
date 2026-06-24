import BotonPrincipal from '../boton_principal/BotonPrincipal';
import IconoApp from '../icono_app/IconoApp';
import { construirEnlaceWhatsapp } from '../../utilidades/enlaceWhatsapp';
import '../../../estilos/compartido/enlace_whatsapp/enlace_whatsapp.css';

export default function BotonWhatsapp({
  telefono,
  mensaje,
  codigoPais,
  children = 'Escríbenos por WhatsApp',
  anchoCompleto = false,
  variante = 'whatsapp',
  className = '',
}) {
  const href = construirEnlaceWhatsapp(telefono, { mensaje, codigoPais });
  if (!href) return null;

  return (
    <BotonPrincipal
      href={href}
      variante={variante}
      anchoCompleto={anchoCompleto}
      className={`enlace-whatsapp ${className}`.trim()}
      target="_blank"
      rel="noopener noreferrer"
    >
      <IconoApp nombre="whatsapp" tamano="sm" />
      {children}
    </BotonPrincipal>
  );
}
