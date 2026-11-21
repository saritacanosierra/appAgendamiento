import { useEffect, useState } from 'react';
import { useAuthMarca } from '../../../aplicacion/proveedores/ProveedorAuth';
import { crearPagoWompi, obtenerPlanMarca } from '../../../modulos/suscripcion/servicios/suscripcionServicio';
import '../../../estilos/componentes/pago_plan/pago_plan.css';

const SCRIPT_WOMPI = 'https://checkout.wompi.co/widget.js';

const PLANES_BASE = [
  { tipo: 'mensual', etiqueta: 'Mensual', meses: 1, precio: 25000 },
  { tipo: 'trimestral', etiqueta: 'Trimestral', meses: 3, precio: 90000 },
  { tipo: 'semestral', etiqueta: 'Semestral', meses: 6, precio: 180000 },
  { tipo: 'anual', etiqueta: 'Anual', meses: 12, precio: 360000 },
];

function cargarWidget() {
  if (window.WidgetCheckout) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existente = document.querySelector(`script[src="${SCRIPT_WOMPI}"]`);
    if (existente) {
      existente.addEventListener('load', () => resolve(), { once: true });
      existente.addEventListener('error', () => reject(new Error('No se pudo abrir Wompi.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_WOMPI;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo abrir Wompi.'));
    document.body.appendChild(script);
  });
}

function pesos(valor) {
  return Number(valor).toLocaleString('es-CO');
}

function esperar(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

const CLAVE_AVISO_ABIERTO = 'pago-plan-aviso-abierto';

function finDeLaPrueba(venceEn) {
  const [anio, mes, dia] = String(venceEn).split('-').map(Number);
  if (!anio || !mes || !dia) return null;
  return new Date(anio, mes - 1, dia, 23, 59, 59);
}

function usarCuentaRegresiva(venceEn) {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    if (!venceEn) return undefined;
    const id = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [venceEn]);

  const fin = venceEn ? finDeLaPrueba(venceEn) : null;
  if (!fin) return null;

  const resta = fin.getTime() - ahora;
  const fecha = fin.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (resta <= 0) {
    return { reloj: '00:00:00', detalle: 'La prueba ya terminó.', fecha };
  }

  const total = Math.floor(resta / 1000);
  const dias = Math.floor(total / 86400);
  const horas = Math.floor((total % 86400) / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;
  const relojHora = [horas, minutos, segundos].map((n) => String(n).padStart(2, '0')).join(':');
  const reloj = dias > 0
    ? `${dias} ${dias === 1 ? 'día' : 'días'} ${relojHora}`
    : relojHora;

  return { reloj, detalle: null, fecha: `Termina el ${fecha}` };
}

export default function PagoPlanMarca({ variante = 'muro' }) {
  const { recargarSesionMarca } = useAuthMarca();
  const [plan, setPlan] = useState(null);
  const [planes, setPlanes] = useState(PLANES_BASE);
  const [tipo, setTipo] = useState('mensual');
  const [wompiListo, setWompiListo] = useState(false);
  const [error, setError] = useState(null);
  const [pagando, setPagando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [avisoAbierto, setAvisoAbierto] = useState(() => {
    if (typeof sessionStorage === 'undefined') return true;
    return sessionStorage.getItem(CLAVE_AVISO_ABIERTO) !== '0';
  });

  useEffect(() => {
    obtenerPlanMarca()
      .then((datos) => {
        setPlan(datos.plan);
        if (Array.isArray(datos.planes) && datos.planes.length > 0) setPlanes(datos.planes);
        setWompiListo(Boolean(datos.wompiConfigurado));
      })
      .catch((err) => setError(err.message));
  }, []);

  const elegido = planes.find((item) => item.tipo === tipo) ?? planes[0];

  async function confirmarCuandoWompiAvise() {
    for (let intento = 0; intento < 8; intento += 1) {
      await esperar(2000);
      const datos = await obtenerPlanMarca();
      if (datos.plan?.vigente && !datos.plan?.vencido) {
        setPlan(datos.plan);
        await recargarSesionMarca();
        setMensaje('Pago confirmado. Tu agenda ya está abierta.');
        return;
      }
    }
    setMensaje('Wompi está confirmando el pago. Si ya se debitó, recarga el panel en un momento.');
  }

  async function pagar() {
    setPagando(true);
    setError(null);
    try {
      const datos = await crearPagoWompi(elegido.tipo);
      await cargarWidget();
      const checkout = new window.WidgetCheckout({
        currency: datos.moneda,
        amountInCents: datos.montoCentavos,
        reference: datos.referencia,
        publicKey: datos.publicKey,
        signature: { integrity: datos.integridad },
        redirectUrl: datos.redirectUrl,
      });
      checkout.open(() => {
        setMensaje('Wompi está confirmando el pago. En un momento el plan queda activo.');
        confirmarCuandoWompiAvise().catch(() => {
          setMensaje('Wompi está confirmando el pago. Recarga el panel en un momento.');
        });
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setPagando(false);
    }
  }

  const cuenta = usarCuentaRegresiva(plan?.prueba ? plan.venceEn : null);
  const puedeMinimizar = variante === 'aviso';
  const titulo = plan?.vencido
    ? 'Hay que pagar para seguir usando la agenda'
    : plan?.prueba
      ? 'Prueba gratis'
      : 'Elige cada cuánto pagar';

  function alternarAviso() {
    setAvisoAbierto((abierto) => {
      const siguiente = !abierto;
      sessionStorage.setItem(CLAVE_AVISO_ABIERTO, siguiente ? '1' : '0');
      return siguiente;
    });
  }

  return (
    <section className={`pago-plan pago-plan--${variante}${puedeMinimizar && !avisoAbierto ? ' pago-plan--minimizado' : ''}`}>
      <div className="pago-plan__cabecera">
        <div className="pago-plan__cabecera-texto">
          <p className="pago-plan__etiqueta">Suscripción</p>
          <h2>{titulo}</h2>
          {cuenta && (
            <p className="pago-plan__cuenta" aria-live="polite">
              {cuenta.detalle && <span>{cuenta.detalle}</span>}
              <strong>{cuenta.reloj}</strong>
              <span>{cuenta.fecha}</span>
            </p>
          )}
        </div>
        {puedeMinimizar && (
          <button
            type="button"
            className="pago-plan__minimizar"
            aria-expanded={avisoAbierto}
            onClick={alternarAviso}
          >
            {avisoAbierto ? 'Minimizar' : 'Mostrar'}
          </button>
        )}
      </div>
      {(!puedeMinimizar || avisoAbierto) && (
      <>
      <p>
        La prueba gratis es una sola vez, 8 días. El mes vale $25.000. El trimestre $90.000, el semestre $180.000 y el año $360.000, pagados de una sola vez con Wompi.
      </p>
      <p>
        Si se acaba el tiempo, las citas, fotos y clientas siguen guardadas. La agenda se pausa hasta el nuevo pago.
      </p>
      <div className="pago-plan__periodos" role="radiogroup" aria-label="Cada cuánto pagar">
        {planes.map((opcion) => (
          <button
            key={opcion.tipo}
            type="button"
            role="radio"
            aria-checked={opcion.tipo === elegido.tipo}
            className={opcion.tipo === elegido.tipo
              ? 'pago-plan__periodo pago-plan__periodo--activo'
              : 'pago-plan__periodo'}
            onClick={() => setTipo(opcion.tipo)}
          >
            <span>{opcion.etiqueta}</span>
            <strong>${pesos(opcion.precio)}</strong>
          </button>
        ))}
      </div>
      {mensaje && <p className="pago-plan__ok">{mensaje}</p>}
      {error && <p className="pago-plan__error">{error}</p>}
      {wompiListo ? (
        <button type="button" className="pago-plan__boton" onClick={pagar} disabled={pagando}>
          {pagando ? 'Abriendo Wompi...' : `Pagar $${pesos(elegido.precio)} con Wompi`}
        </button>
      ) : (
        <p className="pago-plan__aviso">
          El cobro con Wompi se activa cuando quien administra la plataforma configura las llaves del comercio.
        </p>
      )}
      </>
      )}
    </section>
  );
}
