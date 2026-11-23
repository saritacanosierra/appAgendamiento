import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../aplicacion/proveedores/ProveedorAuth';
import { RUTAS_ADMIN, RUTAS_PLATAFORMA } from '../../../compartido/constantes';
import '../../../estilos/publico/condiciones/condiciones.css';

function destinoVolver(valor) {
  if (!valor || !valor.startsWith('/') || valor.startsWith('//')) return null;
  const ruta = valor.split('?')[0];
  if (ruta.startsWith('/m/') || ruta.startsWith('/admin/') || ruta.startsWith('/plataforma/')) return valor;
  return null;
}

export default function CondicionesVista() {
  const [params] = useSearchParams();
  const { autenticadoMarca, autenticadoPlataforma, sesionMarca, sesionPlataforma } = useAuth();
  const pedido = destinoVolver(params.get('volver'));
  const cargando = sesionMarca.cargando || sesionPlataforma.cargando;
  const volver = pedido
    || (autenticadoMarca ? RUTAS_ADMIN.panel : null)
    || (autenticadoPlataforma ? RUTAS_PLATAFORMA.panel : null)
    || (cargando ? null : '/');
  const textoVolver = volver === '/' ? 'Volver al inicio' : 'Volver al panel';

  return (
    <article className="condiciones">
      <div className="condiciones__ancho">
        {volver && (
          <Link className="condiciones__volver" to={volver}>{textoVolver}</Link>
        )}
        <h1>Condiciones y acceso</h1>
        <p>
          Aquí está cómo funciona la agenda, qué puede hacer cada persona y cómo se guarda la información de cada empresa.
        </p>

        <section>
          <h2>Tres entradas, separadas</h2>
          <p>Hay tres puertas. No comparten sesión ni ven los mismos datos.</p>
          <ul>
            <li>La clienta entra por el enlace de una tienda, <strong>/m/nombre</strong>. No crea cuenta ni usa contraseña.</li>
            <li>El propietario de la marca entra por <strong>/admin</strong> con el correo y la contraseña de su perfil. Solo ve su marca.</li>
            <li>Quien administra la plataforma entra por <strong>/plataforma</strong>. Ve las empresas de una en una.</li>
          </ul>
        </section>

        <section>
          <h2>Qué puede hacer la clienta</h2>
          <ul>
            <li>Ver esa tienda, sus servicios, su equipo, su galería y su blog.</li>
            <li>Pedir una cita, consultarla, cancelarla o pedir otro horario con el WhatsApp de esa tienda.</li>
            <li>El mismo celular en dos tiendas son dos fichas distintas. Una no muestra las citas de la otra.</li>
            <li>El código de una cita solo abre la tienda que está en el enlace. El código de otra tienda no aparece.</li>
          </ul>
        </section>

        <section>
          <h2>Qué puede hacer el propietario de la marca</h2>
          <ul>
            <li>Gestionar la agenda, las clientas, los servicios, la galería, el blog, el equipo y los datos de su marca.</li>
            <li>No ve las clientas, las citas ni las fotos de otra empresa.</li>
            <li>Entra con el correo y la contraseña del registro. Si la cuenta es anterior y solo tenía WhatsApp, también puede entrar con ese número.</li>
            <li>Para recuperar la contraseña necesita el correo de la cuenta y el WhatsApp de la marca.</li>
            <li>Los primeros 8 días son gratis, una sola vez por cuenta. Después el periodo se paga con Wompi. Los precios están en la página de inicio.</li>
          </ul>
        </section>

        <section>
          <h2>Qué puede hacer la plataforma</h2>
          <ul>
            <li>Crear, revisar y, si hace falta, eliminar una empresa.</li>
            <li>Entrar al panel de una empresa sin mezclar esa sesión con la de plataforma.</li>
            <li>Guardar y restaurar la copia de una empresa. Esa acción no escribe en las demás.</li>
            <li>Borrar la copia de una empresa que ya no está. Esa copia no vuelve.</li>
            <li>Configurar la cuenta de Wompi con la que se cobran las suscripciones de todas las marcas.</li>
          </ul>
        </section>

        <section>
          <h2>Cómo se guarda la información</h2>
          <p>
            Una cita, una clienta o un cambio quedan guardados en el momento. Además, una vez por semana se guarda sola una copia de cada empresa, separada de las otras. También se puede guardar una copia a mano desde la plataforma.
          </p>
          <p>
            De cada empresa se conservan las últimas 8 copias automáticas y las últimas 8 copias hechas a mano. La copia incluye los datos de esa empresa. Las fotos siguen en su archivo; la copia guarda la dirección, no el archivo.
          </p>
        </section>

        <section>
          <h2>Qué pasa al restaurar</h2>
          <p>
            Restaurar devuelve solo esa empresa a la fecha de la copia. Las demás quedan como están. Las citas de esa empresa hechas después de la copia se reemplazan por las de la copia.
          </p>
          <p>
            Si algo se borró y todavía no existía una copia, no hay de dónde recuperarlo. La copia de la semana siguiente no reconstruye lo que ya no estaba.
          </p>
        </section>

        <section>
          <h2>Si se pierde información</h2>
          <p>
            La app no se hace responsable si se pierde información. La copia semanal es una ayuda, no una garantía de que todo se pueda recuperar.
          </p>
          <p>
            Si no había una copia, si el propietario de la marca borró un dato, si una foto no está dentro del archivo de la copia, si falla el equipo o si el servicio se detiene, la app queda liberada de toda responsabilidad por esa pérdida. Lo que el propietario de la marca no puede perder debe guardarlo también por su cuenta.
          </p>
        </section>

        <section>
          <h2>Si el periodo no está pago</h2>
          <p>
            El propietario de la marca puede entrar para pagar. La agenda pública de esa tienda queda pausada. Los datos no se borran por falta de pago.
          </p>
        </section>
      </div>
    </article>
  );
}
