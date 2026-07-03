import { useState } from 'react';
import ImagenAmpliable from '../imagen_ampliable/ImagenAmpliable';
import IconoApp from '../icono_app/IconoApp';
import ModalConfirmacion from '../modal_confirmacion/ModalConfirmacion';
import { construirEnlaceWhatsapp } from '../../utilidades/enlaceWhatsapp';
import '../../../estilos/compartido/encabezado_marca/encabezado_marca.css';

function inicialMarca(nombre) {
  return (nombre?.trim()?.charAt(0) ?? 'M').toLocaleUpperCase('es');
}

function digitosTelefono(valor) {
  return String(valor ?? '').replace(/\D+/g, '');
}

function enlaceGoogleMaps(direccion) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
}

function ContactoCompacto({
  telefonoLimpio,
  direccionLimpia,
  enlaceTelefono,
  enlaceWhatsapp,
  onVerDireccion,
}) {
  return (
    <div className="encabezado-marca__contacto-iconos">
      {telefonoLimpio && enlaceTelefono && (
        <a
          className="encabezado-marca__icono-btn"
          href={enlaceTelefono}
          aria-label={`Llamar al ${telefonoLimpio}`}
        >
          <IconoApp nombre="telefono" tamano="sm" className="encabezado-marca__contacto-icono" />
        </a>
      )}
      {telefonoLimpio && !enlaceTelefono && (
        <button
          type="button"
          className="encabezado-marca__icono-btn"
          aria-label={`Telefono ${telefonoLimpio}`}
          onClick={() => onVerDireccion('telefono', telefonoLimpio)}
        >
          <IconoApp nombre="telefono" tamano="sm" className="encabezado-marca__contacto-icono" />
        </button>
      )}
      {direccionLimpia && (
        <button
          type="button"
          className="encabezado-marca__icono-btn"
          aria-label="Ver ubicacion"
          onClick={() => onVerDireccion('direccion', direccionLimpia)}
        >
          <IconoApp nombre="ubicacion" tamano="sm" className="encabezado-marca__contacto-icono" />
        </button>
      )}
      {enlaceWhatsapp && (
        <a
          className="encabezado-marca__icono-btn encabezado-marca__icono-btn--whatsapp"
          href={enlaceWhatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribir por WhatsApp"
        >
          <IconoApp nombre="whatsapp" tamano="sm" className="encabezado-marca__whatsapp-icono" />
        </a>
      )}
    </div>
  );
}

function ContactoCompleto({
  telefonoLimpio,
  direccionLimpia,
  enlaceTelefono,
  enlaceWhatsapp,
}) {
  return (
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
  );
}

export default function EncabezadoMarca({ marca, titulo, compacto = false }) {
  const [modalContacto, setModalContacto] = useState(null);

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

  function abrirModalContacto(tipo, valor) {
    setModalContacto({ tipo, valor });
  }

  function cerrarModalContacto() {
    setModalContacto(null);
  }

  function confirmarModalContacto() {
    if (!modalContacto) return;
    if (modalContacto.tipo === 'direccion') {
      window.open(enlaceGoogleMaps(modalContacto.valor), '_blank', 'noopener,noreferrer');
    } else if (modalContacto.tipo === 'telefono' && enlaceTelefono) {
      window.location.href = enlaceTelefono;
    }
    cerrarModalContacto();
  }

  const tituloModal = modalContacto?.tipo === 'direccion' ? 'Ubicacion' : 'Telefono';
  const textoConfirmarModal = modalContacto?.tipo === 'direccion' ? 'Abrir en Maps' : 'Llamar';

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
          {tieneContacto && (
            <ContactoCompacto
              telefonoLimpio={telefonoLimpio}
              direccionLimpia={direccionLimpia}
              enlaceTelefono={enlaceTelefono}
              enlaceWhatsapp={enlaceWhatsapp}
              onVerDireccion={abrirModalContacto}
            />
          )}
        </div>

        <ModalConfirmacion
          abierto={Boolean(modalContacto)}
          titulo={tituloModal}
          mensaje={modalContacto?.valor}
          onConfirmar={confirmarModalContacto}
          onCancelar={cerrarModalContacto}
          textoConfirmar={textoConfirmarModal}
          textoCancelar="Cerrar"
        />
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
        {tieneContacto && (
          <ContactoCompleto
            telefonoLimpio={telefonoLimpio}
            direccionLimpia={direccionLimpia}
            enlaceTelefono={enlaceTelefono}
            enlaceWhatsapp={enlaceWhatsapp}
          />
        )}
      </div>
    </header>
  );
}
