import ImagenAmpliable from '../imagen_ampliable/ImagenAmpliable';
import IconoApp from '../icono_app/IconoApp';
import { construirEnlaceWhatsapp } from '../../utilidades/enlaceWhatsapp';
import '../../../estilos/compartido/encabezado_marca/encabezado_marca.css';

function inicialMarca(nombre) {
  return (nombre?.trim()?.charAt(0) ?? 'M').toLocaleUpperCase('es');
}

function digitosTelefono(valor) {
  return String(valor ?? '').replace(/\D+/g, '');
}

export default function EncabezadoMarca({ marca, titulo, compacto = false }) {
  if (!marca) return null;

  const telefonoLimpio = marca.telefono?.trim() || null;
  const whatsappLimpio = marca.whatsapp?.trim() || null;
  const direccionLimpia = marca.direccion?.trim() || null;
  const numeroWhatsapp = whatsappLimpio || telefonoLimpio;
  const enlaceWhatsapp = numeroWhatsapp ? construirEnlaceWhatsapp(numeroWhatsapp) : null;
  const enlaceTelefono = telefonoLimpio ? `tel:${digitosTelefono(telefonoLimpio)}` : null;
  const tieneContacto = Boolean(telefonoLimpio || direccionLimpia || enlaceWhatsapp);

  const clases = ['encabezado-marca', compacto ? 'encabezado-marca--compacto' : '']
    .filter(Boolean)
    .join(' ');

  const marcoClases = [
    'encabezado-marca__logo-marco',
    compacto ? 'encabezado-marca__logo-marco--compacto' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const contacto = tieneContacto ? (
    <div className="encabezado-marca__contacto-fila">
      {telefonoLimpio && (
        enlaceTelefono ? (
          <a
            className="encabezado-marca__contacto-chip"
            href={enlaceTelefono}
            aria-label={`Llamar al ${telefonoLimpio}`}
          >
            <IconoApp nombre="telefono" tamano="sm" className="encabezado-marca__contacto-icono" />
            <span>{telefonoLimpio}</span>
          </a>
        ) : (
          <span className="encabezado-marca__contacto-chip">
            <IconoApp nombre="telefono" tamano="sm" className="encabezado-marca__contacto-icono" />
            <span>{telefonoLimpio}</span>
          </span>
        )
      )}
      {direccionLimpia && (
        <span className="encabezado-marca__contacto-chip" title={direccionLimpia}>
          <IconoApp nombre="ubicacion" tamano="sm" className="encabezado-marca__contacto-icono" />
          <span>{direccionLimpia}</span>
        </span>
      )}
      {enlaceWhatsapp && (
        <a
          className="encabezado-marca__whatsapp"
          href={enlaceWhatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribir por WhatsApp"
        >
          <IconoApp nombre="whatsapp" tamano="sm" className="encabezado-marca__whatsapp-icono" />
          <span>WhatsApp</span>
        </a>
      )}
    </div>
  ) : null;

  if (compacto) {
    return (
      <header className={clases}>
        <div className="encabezado-marca__fila-principal">
          <div className={marcoClases}>
            {marca.logo ? (
              <ImagenAmpliable
                className="encabezado-marca__logo"
                src={marca.logo}
                alt={marca.nombreComercial}
              />
            ) : (
              <span className="encabezado-marca__logo-inicial">{inicialMarca(marca.nombreComercial)}</span>
            )}
          </div>
          <div className="encabezado-marca__identidad">
            <p className="encabezado-marca__nombre">{marca.nombreComercial}</p>
          </div>
        </div>
        {contacto}
      </header>
    );
  }

  return (
    <header className={clases}>
      <div className={marcoClases}>
        {marca.logo ? (
          <ImagenAmpliable
            className="encabezado-marca__logo"
            src={marca.logo}
            alt={marca.nombreComercial}
          />
        ) : (
          <span className="encabezado-marca__logo-inicial">{inicialMarca(marca.nombreComercial)}</span>
        )}
      </div>
      <div className="encabezado-marca__texto">
        <h1>{titulo ?? marca.nombreComercial}</h1>
        {!titulo && marca.descripcion && <p>{marca.descripcion}</p>}
        {titulo && (
          <p className="encabezado-marca__subtitulo">{marca.nombreComercial}</p>
        )}
        {contacto}
      </div>
    </header>
  );
}
