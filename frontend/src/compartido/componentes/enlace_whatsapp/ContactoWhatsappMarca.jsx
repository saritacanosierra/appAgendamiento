import BotonWhatsapp from '../enlace_whatsapp/BotonWhatsapp';
import {
  mensajeContactoMarca,
} from '../../utilidades/enlaceWhatsapp';
import '../../../estilos/compartido/enlace_whatsapp/enlace_whatsapp.css';

export default function ContactoWhatsappMarca({
  marca,
  mensaje,
  anchoCompleto = true,
  children,
  mostrarNumero = true,
}) {
  if (!marca?.whatsapp) return null;

  const textoMensaje = mensaje ?? mensajeContactoMarca({ nombreMarca: marca.nombreComercial });

  return (
    <section className="contacto-marca-whatsapp" aria-label="Contacto por WhatsApp">
      <p className="contacto-marca-whatsapp__texto">
        ¿Prefieres escribirnos directo? Abre WhatsApp con un mensaje listo — no necesitas configurar la API de Meta.
      </p>
      {mostrarNumero && (
        <p className="contacto-marca-whatsapp__numero">{marca.whatsapp}</p>
      )}
      <BotonWhatsapp telefono={marca.whatsapp} mensaje={textoMensaje} anchoCompleto={anchoCompleto}>
        {children}
      </BotonWhatsapp>
    </section>
  );
}
