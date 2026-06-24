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

  const telefono = marca.telefono?.trim() || null;
  const whatsapp = marca.whatsapp?.trim() || null;
  const direccion = marca.direccion?.trim() || null;
  const numeroVisible = telefono || whatsapp;
  const enlaceWhatsapp = whatsapp ? construirEnlaceWhatsapp(whatsapp) : null;
  const enlaceTelefono = telefono ? `tel:${digitosTelefono(telefono)}` : null;
  const tieneContacto = Boolean(numeroVisible || direccion);

  const clases = ['encabezado-marca', compacto ? 'encabezado-marca--compacto' : '']
    .filter(Boolean)
    .join(' ');

  const marcoClases = [
    'encabezado-marca__logo-marco',
    compacto ? 'encabezado-marca__logo-marco--compacto' : '',
  ]
    .filter(Boolean)
    .join(' ');

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

        {tieneContacto && (
          <ul className="encabezado-marca__contacto">
            {numeroVisible && (
              <li>
                <IconoApp nombre="telefono" tamano="sm" className="encabezado-marca__contacto-icono" />
                {enlaceTelefono ? (
                  <a href={enlaceTelefono}>{numeroVisible}</a>
                ) : enlaceWhatsapp ? (
                  <a href={enlaceWhatsapp} target="_blank" rel="noopener noreferrer">
                    {numeroVisible}
                  </a>
                ) : (
                  <span>{numeroVisible}</span>
                )}
              </li>
            )}
            {direccion && (
              <li>
                <IconoApp nombre="ubicacion" tamano="sm" className="encabezado-marca__contacto-icono" />
                <span>{direccion}</span>
              </li>
            )}
          </ul>
        )}
      </div>
    </header>
  );
}
