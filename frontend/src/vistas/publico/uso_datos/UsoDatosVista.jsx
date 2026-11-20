import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../aplicacion/proveedores/ProveedorAuth';
import {
  aceptarPoliticaPrivacidad,
  obtenerPoliticaPrivacidad,
} from '../../../modulos/configuracion_marca/servicios/configuracionServicio';
import '../../../estilos/publico/condiciones/condiciones.css';

function destinoVolver(valor) {
  if (!valor || !valor.startsWith('/') || valor.startsWith('//')) return null;
  const ruta = valor.split('?')[0];
  if (ruta.startsWith('/m/') || ruta.startsWith('/admin/')) return valor;
  return null;
}

function fechaLegible(valor) {
  if (!valor) return '';
  const fecha = new Date(String(valor).replace(' ', 'T'));
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' });
}

export default function UsoDatosVista() {
  const [params] = useSearchParams();
  const volver = destinoVolver(params.get('volver'));
  const { autenticadoMarca, usuarioMarca } = useAuth();
  const esPropietario = autenticadoMarca && usuarioMarca?.rol === 'admin';
  const [deAcuerdo, setDeAcuerdo] = useState(false);
  const [politica, setPolitica] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!esPropietario) return undefined;
    let vigente = true;
    obtenerPoliticaPrivacidad()
      .then((datos) => {
        if (vigente) setPolitica(datos);
      })
      .catch(() => {
        if (vigente) setPolitica(null);
      });
    return () => {
      vigente = false;
    };
  }, [esPropietario]);

  async function marcarAcuerdo(evento) {
    evento.preventDefault();
    if (!deAcuerdo) {
      setError('Marca la casilla para dejar constancia de que estás de acuerdo.');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      const datos = await aceptarPoliticaPrivacidad();
      setPolitica(datos);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <article className="condiciones">
      <div className="condiciones__ancho">
        {volver && (
          <Link className="condiciones__volver" to={volver}>Volver</Link>
        )}
        <h1>Política de privacidad</h1>
        <p>
          Esta política explica qué datos trata la agenda, quién responde por ellos y el límite de responsabilidad de la aplicación.
        </p>

        <section>
          <h2>1. Alcance</h2>
          <p>
            Aplica a quien reserva en una tienda y al propietario de la marca que usa el panel. Quien reserva no crea cuenta. El propietario entra con su WhatsApp o su correo y su contraseña, y solo ve su marca.
          </p>
        </section>

        <section>
          <h2>2. Quién responde por los datos de las clientas</h2>
          <p>
            El propietario de la marca decide qué datos pide y para qué los usa en su negocio. La aplicación es la herramienta que los guarda. No reemplaza el deber del propietario de informar a sus clientas ni de cumplir las normas de privacidad que le correspondan en su país.
          </p>
        </section>

        <section>
          <h2>3. Datos de quien reserva</h2>
          <ul>
            <li>Nombre y WhatsApp escritos al pedir la cita.</li>
            <li>Servicio, día, hora y código de esa reserva.</li>
          </ul>
          <p>
            Se usan para anotar la cita, avisarla por WhatsApp y permitir consultarla, cancelarla o pedir otro horario en esa misma tienda. El mismo número en otra tienda es otra ficha. Una tienda no ve las citas de la otra.
          </p>
        </section>

        <section>
          <h2>4. Datos del propietario de la marca</h2>
          <p>
            Nombre del negocio, WhatsApp, contraseña y lo que cargue en el panel: servicios, horarios, fotos, equipo y citas. La contraseña se guarda cifrada. Esos datos sirven para operar su agenda y no se venden.
          </p>
        </section>

        <section>
          <h2>5. Quién puede verlos</h2>
          <ul>
            <li>Quien reserva ve lo necesario para su cita en esa tienda.</li>
            <li>El propietario de la marca ve solo su marca.</li>
            <li>Quien administra la plataforma puede abrir una empresa para soporte, sin mezclar esa sesión con las demás.</li>
          </ul>
        </section>

        <section>
          <h2>6. Conservación</h2>
          <p>
            Los datos permanecen mientras la marca exista. La copia semanal es una ayuda operativa. No obliga a conservar ni a recuperar todo. Las fotos no van dentro de esa copia: la copia guarda la dirección del archivo, no el archivo.
          </p>
        </section>

        <section>
          <h2>7. Exención de responsabilidad</h2>
          <p>
            Al usar la aplicación, el propietario de la marca acepta que la aplicación y quien la administra quedan liberados de toda responsabilidad por la pérdida, alteración, filtración, acceso no autorizado, indisponibilidad o imposibilidad de recuperar información.
          </p>
          <p>Esa liberación incluye, entre otros casos:</p>
          <ul>
            <li>Que no exista una copia, o que la copia no alcance para reconstruir lo borrado.</li>
            <li>Que el propietario o su equipo borre datos, citas, fotos o la empresa.</li>
            <li>Fallas del equipo, de la red, del correo o de un proveedor externo.</li>
            <li>El uso de la contraseña, del WhatsApp o del enlace de la tienda.</li>
            <li>Citas que no se concreten, clientas que no lleguen y cualquier daño directo o indirecto, incluido el lucro cesante.</li>
          </ul>
          <p>
            La copia semanal no es una garantía ni un seguro. La aplicación no promete que la información pueda recuperarse. Lo que el propietario no puede perder debe guardarlo también por su cuenta.
          </p>
        </section>

        <section>
          <h2>8. Aceptación</h2>
          <p>
            El propietario de la marca debe leer esta política y marcar que está de acuerdo. Esa marca queda guardada en su empresa. Quien reserva conoce este uso al abrir el enlace de la tienda.
          </p>
          {esPropietario && (
            politica?.aceptada ? (
              <p className="condiciones__aceptada">
                Marcado de acuerdo el {fechaLegible(politica.aceptadaEn)}.
              </p>
            ) : (
              <form className="condiciones__acuerdo" onSubmit={marcarAcuerdo}>
                <label>
                  <input
                    type="checkbox"
                    checked={deAcuerdo}
                    onChange={(e) => setDeAcuerdo(e.target.checked)}
                  />
                  <span>
                    Soy el propietario de la marca. Leí la política de privacidad y estoy de acuerdo. Acepto que la aplicación queda liberada de toda responsabilidad por la pérdida, el uso o la imposibilidad de recuperar la información.
                  </span>
                </label>
                {error && <p className="condiciones__error" role="alert">{error}</p>}
                <button type="submit" disabled={!deAcuerdo || enviando}>
                  {enviando ? 'Guardando...' : 'Marcar de acuerdo'}
                </button>
              </form>
            )
          )}
        </section>
      </div>
    </article>
  );
}
