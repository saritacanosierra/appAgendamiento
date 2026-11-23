import { useEffect, useState } from 'react';
import { crearPagoWompi, obtenerPlanMarca } from '../../../modulos/suscripcion/servicios/suscripcionServicio';
import '../../../estilos/componentes/pago_plan/pago_plan.css';

const PASARELA_WOMPI = 'https://checkout.wompi.co/p/';

const PLANES_BASE = [
  { tipo: 'mensual', etiqueta: 'Mensual', meses: 1, precio: 25000 },
  { tipo: 'trimestral', etiqueta: 'Trimestral', meses: 3, precio: 90000 },
  { tipo: 'semestral', etiqueta: 'Semestral', meses: 6, precio: 180000 },
  { tipo: 'anual', etiqueta: 'Anual', meses: 12, precio: 360000 },
];

function pesos(valor) {
  return Number(valor).toLocaleString('es-CO');
}

function textoErrorCobro(err) {
  const texto = String(err?.message ?? '');
  if (/no esta configurado|no está configurado/i.test(texto)) {
    return 'Todavía no se puede pagar: quien administra la plataforma debe guardar la cuenta de Wompi.';
  }
  return texto || 'No se pudo abrir la pasarela de pago.';
}

function abrirPasarelaWompi(datos) {
  if (!datos?.publicKey || !datos?.referencia || !datos?.integridad || !datos?.montoCentavos) {
    throw new Error('Wompi no devolvió los datos del cobro.');
  }

  // Wompi documenta el Web Checkout como formulario GET, no como URL armada a mano.
  const form = document.createElement('form');
  form.method = 'GET';
  form.action = PASARELA_WOMPI;
  form.acceptCharset = 'UTF-8';
  form.style.display = 'none';

  const campos = {
    'public-key': datos.publicKey,
    currency: datos.moneda || 'COP',
    'amount-in-cents': String(datos.montoCentavos),
    reference: datos.referencia,
    'signature:integrity': datos.integridad,
  };
  if (datos.redirectUrl) campos['redirect-url'] = datos.redirectUrl;

  Object.entries(campos).forEach(([nombre, valor]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = nombre;
    input.value = valor;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
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
  const [plan, setPlan] = useState(null);
  const [planes, setPlanes] = useState(PLANES_BASE);
  const [tipo, setTipo] = useState('mensual');
  const [wompiListo, setWompiListo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [pagando, setPagando] = useState(false);
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
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  const elegido = planes.find((item) => item.tipo === tipo) ?? planes[0];

  async function pagar() {
    if (pagando || !elegido?.tipo) return;
    if (!wompiListo) {
      setError('Todavía no se puede pagar: quien administra la plataforma debe guardar la cuenta de Wompi.');
      return;
    }
    setPagando(true);
    setError(null);
    try {
      const datos = await crearPagoWompi(elegido.tipo, {
        redirectUrl: `${window.location.origin}/admin/panel/`,
      });
      abrirPasarelaWompi(datos);
    } catch (err) {
      setError(textoErrorCobro(err));
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
            {avisoAbierto ? 'Ocultar precios' : 'Elegir plan'}
          </button>
        )}
      </div>
      {(!puedeMinimizar || avisoAbierto) && (
      <>
      <p>
        La prueba gratis es una sola vez, 8 días. Toca el periodo que quieres y luego el botón de pagar para abrir Wompi.
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
            aria-checked={opcion.tipo === elegido?.tipo}
            className={opcion.tipo === elegido?.tipo
              ? 'pago-plan__periodo pago-plan__periodo--activo'
              : 'pago-plan__periodo'}
            onClick={() => {
              setTipo(opcion.tipo);
              setError(null);
            }}
            disabled={pagando || cargando}
          >
            <span>{opcion.etiqueta}</span>
            <strong>${pesos(opcion.precio)}</strong>
          </button>
        ))}
      </div>
      {error && <p className="pago-plan__error" role="alert">{error}</p>}
      {!wompiListo && !cargando && (
        <p className="pago-plan__aviso">
          El cobro se activa cuando quien administra la plataforma guarda la cuenta de Wompi.
        </p>
      )}
      <button
        type="button"
        className="pago-plan__boton"
        onClick={pagar}
        disabled={pagando || cargando || !elegido || !wompiListo}
      >
        {pagando
          ? 'Abriendo Wompi...'
          : !wompiListo
            ? 'Pago aún no disponible'
            : `Pagar ${elegido?.etiqueta?.toLowerCase() ?? ''} $${pesos(elegido?.precio)} con Wompi`}
      </button>
      </>
      )}
    </section>
  );
}
