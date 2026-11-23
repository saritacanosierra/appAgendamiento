import { ModalGuia } from '../../../compartido/componentes';

export default function GuiasIntegracionModales({ guiaAbierta, onCerrar }) {
  return (
    <>
      <ModalGuia
        abierto={guiaAbierta === 'whatsapp'}
        titulo="Cómo sacar los datos de WhatsApp"
        onCerrar={onCerrar}
      >
        <p className="modal-guia__que-es">
          <strong>¿Para qué sirve?</strong>
          Esto no es el número público de Contacto (wa.me). Es la API de Meta
          para que la agenda envíe sola el mensaje de confirmación al celular de la clienta.
        </p>
        <section className="modal-guia__paso">
          <h3 className="modal-guia__paso-titulo">1. Ten una cuenta Business de Meta</h3>
          <ol>
            <li>Entra a Meta Business Suite o WhatsApp Manager con la cuenta del negocio.</li>
            <li>Activa WhatsApp Business Platform (API) para ese número.</li>
          </ol>
          <a
            className="modal-guia__enlace"
            href="https://business.facebook.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir Meta Business
          </a>
        </section>
        <section className="modal-guia__paso">
          <h3 className="modal-guia__paso-titulo">2. Copia el Phone Number ID</h3>
          <ol>
            <li>En WhatsApp Manager abre el número que vas a usar.</li>
            <li>Busca el campo <strong>Phone number ID</strong> (o ID del número).</li>
            <li>Cópialo completo: es un número largo, no el celular 300…</li>
          </ol>
          <p className="modal-guia__dato">
            Ejemplo de cómo se ve: <code>123456789012345</code>
          </p>
        </section>
        <section className="modal-guia__paso">
          <h3 className="modal-guia__paso-titulo">3. Genera el token</h3>
          <ol>
            <li>Entra a Meta for Developers → tu app → WhatsApp → API Setup.</li>
            <li>Crea un token de acceso (mejor permanente / de sistema).</li>
            <li>Pégalo en el campo Token de esta pantalla y guárdalo.</li>
          </ol>
          <a
            className="modal-guia__enlace"
            href="https://developers.facebook.com/apps/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir Meta Developers
          </a>
        </section>
        <section className="modal-guia__paso">
          <h3 className="modal-guia__paso-titulo">4. País y prueba</h3>
          <ul>
            <li>Elige el país del número de WhatsApp Business.</li>
            <li>Guarda la configuración.</li>
            <li>Escribe tu celular y pulsa Probar WhatsApp.</li>
          </ul>
        </section>
      </ModalGuia>

      <ModalGuia
        abierto={guiaAbierta === 'correo'}
        titulo="Cómo sacar los datos del correo (SMTP)"
        onCerrar={onCerrar}
      >
        <p className="modal-guia__que-es">
          <strong>¿Qué es SMTP?</strong>
          Es el “servicio de envío” de tu correo. La agenda no tiene buzón propio:
          usa tu Gmail (u otro) para mandar el aviso de la cita. Los datos los da
          tu proveedor de correo, no esta app.
        </p>
        <section className="modal-guia__paso">
          <h3 className="modal-guia__paso-titulo">Si usas Gmail (recomendado)</h3>
          <ol>
            <li>Pulsa <strong>Usar Gmail</strong> en esta pantalla (rellena host y puerto).</li>
            <li>
              En Google activa la verificación en 2 pasos:
              Cuenta Google → Seguridad.
            </li>
            <li>
              Crea una <strong>contraseña de aplicación</strong>
              (Seguridad → Contraseñas de aplicaciones → Correo / Otro).
            </li>
            <li>Google te da 16 letras. Esa es la “Contraseña SMTP”, no tu clave normal.</li>
            <li>En Usuario pon tu Gmail. En Remitente: Nombre &lt;tu@gmail.com&gt;.</li>
            <li>Guarda y prueba enviándote un correo.</li>
          </ol>
          <a
            className="modal-guia__enlace"
            href="https://myaccount.google.com/apppasswords"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir contraseñas de aplicaciones de Google
          </a>
          <p className="modal-guia__dato">
            Host: <code>smtp.gmail.com</code>
            {' · '}
            Puerto: <code>587</code>
            {' · '}
            SSL 465: apagado
          </p>
        </section>
        <section className="modal-guia__paso">
          <h3 className="modal-guia__paso-titulo">Qué va en cada campo</h3>
          <ul>
            <li><strong>Host SMTP:</strong> dirección del servidor de envío (Gmail: smtp.gmail.com).</li>
            <li><strong>Puerto:</strong> casi siempre 587; algunos usan 465 con SSL.</li>
            <li><strong>Usuario:</strong> tu dirección de correo completa.</li>
            <li><strong>Contraseña SMTP:</strong> en Gmail, la de aplicación de 16 letras.</li>
            <li><strong>Remitente:</strong> el nombre que verá la clienta en el “De:”.</li>
          </ul>
        </section>
        <section className="modal-guia__paso">
          <h3 className="modal-guia__paso-titulo">Si no es Gmail</h3>
          <p>
            Host y puerto te los da tu hosting o Outlook/Hotmail.
            Busca “configuración SMTP” en su ayuda y pégalos en Ajustes avanzados.
          </p>
        </section>
      </ModalGuia>
    </>
  );
}
