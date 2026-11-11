import { useEffect, useState } from 'react';
import { crearPagoWompi, obtenerPlanMarca } from '../../../modulos/suscripcion/servicios/suscripcionServicio';
import '../../../estilos/componentes/pago_plan/pago_plan.css';

const SCRIPT_WOMPI = 'https://checkout.wompi.co/widget.js';

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

export default function PagoPlanMarca({ variante = 'muro', onPagado }) {
  const [plan, setPlan] = useState(null);
  const [precio, setPrecio] = useState(25000);
  const [wompiListo, setWompiListo] = useState(false);
  const [error, setError] = useState(null);
  const [pagando, setPagando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    obtenerPlanMarca()
      .then((datos) => {
        setPlan(datos.plan);
        setPrecio(datos.precioMensual ?? 25000);
        setWompiListo(Boolean(datos.wompiConfigurado));
      })
      .catch((err) => setError(err.message));
  }, []);

  async function pagar() {
    setPagando(true);
    setError(null);
    try {
      const datos = await crearPagoWompi();
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
        setMensaje('Wompi esta confirmando el pago. En un momento el plan queda activo.');
        if (onPagado) onPagado();
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setPagando(false);
    }
  }

  const titulo = plan?.vencido
    ? 'Tu plan vencio'
    : plan?.prueba
      ? `Te quedan ${plan.diasRestantes ?? 0} dias gratis`
      : 'Plan del salon';

  return (
    <section className={`pago-plan pago-plan--${variante}`}>
      <p className="pago-plan__etiqueta">Suscripcion</p>
      <h2>{titulo}</h2>
      <p>
        Los primeros 8 dias no se cobran. Despues, el acceso de administradora cuesta
        {' '}
        <strong>${pesos(precio)} al mes</strong>
        {' '}
        y se paga con Wompi.
      </p>
      {plan?.venceEn && <p className="pago-plan__vence">Vigente hasta {plan.venceEn}.</p>}
      {mensaje && <p className="pago-plan__ok">{mensaje}</p>}
      {error && <p className="pago-plan__error">{error}</p>}
      {wompiListo ? (
        <button type="button" className="pago-plan__boton" onClick={pagar} disabled={pagando}>
          {pagando ? 'Abriendo Wompi...' : `Pagar $${pesos(precio)} con Wompi`}
        </button>
      ) : (
        <p className="pago-plan__aviso">
          El cobro con Wompi se activa cuando la duena de la app configura las llaves del comercio.
        </p>
      )}
    </section>
  );
}
