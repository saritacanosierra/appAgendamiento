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

export default function PagoPlanMarca({ variante = 'muro' }) {
  const { recargarSesionMarca } = useAuthMarca();
  const [plan, setPlan] = useState(null);
  const [planes, setPlanes] = useState(PLANES_BASE);
  const [tipo, setTipo] = useState('mensual');
  const [wompiListo, setWompiListo] = useState(false);
  const [error, setError] = useState(null);
  const [pagando, setPagando] = useState(false);
  const [mensaje, setMensaje] = useState('');

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

  const titulo = plan?.vencido
    ? 'Hay que pagar para seguir usando la agenda'
    : plan?.prueba
      ? `Te quedan ${plan.diasRestantes ?? 0} días de la prueba`
      : 'Elige cada cuánto pagar';

  return (
    <section className={`pago-plan pago-plan--${variante}`}>
      <p className="pago-plan__etiqueta">Suscripción</p>
      <h2>{titulo}</h2>
      <p>
        La prueba gratis es una sola vez, 8 días. El mes vale $25.000. El trimestre $90.000, el semestre $180.000 y el año $360.000, pagados de una sola vez con Wompi.
      </p>
      <p>
        Si se acaba el tiempo, las citas, fotos y clientas siguen guardadas. La agenda se pausa hasta el nuevo pago.
      </p>
      {plan?.venceEn && <p className="pago-plan__vence">Vigente hasta {plan.venceEn}.</p>}
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
          El cobro con Wompi se activa cuando la dueña de la app configura las llaves del comercio.
        </p>
      )}
    </section>
  );
}
