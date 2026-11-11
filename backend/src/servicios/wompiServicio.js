import crypto from 'crypto';
import { PagoWompiRepositorio } from '../repositorios/pagoWompiRepositorio.js';
import { suscripcionMarcaServicio } from './suscripcionMarcaServicio.js';
import { PRECIO_MENSUAL_COP } from './registroMarcaServicio.js';

const MONEDA = 'COP';
export const MONTO_MENSUAL_CENTAVOS = PRECIO_MENSUAL_COP * 100;

function leerRuta(objeto, ruta) {
  return String(ruta).split('.').reduce((actual, parte) => actual?.[parte], objeto);
}

export function firmaIntegridadWompi({ referencia, montoCentavos, moneda, secreto }) {
  return crypto
    .createHash('sha256')
    .update(`${referencia}${montoCentavos}${moneda}${secreto}`)
    .digest('hex');
}

export function firmaEventoWompi(evento, secreto) {
  const propiedades = evento?.signature?.properties ?? [];
  const valores = propiedades.map((ruta) => leerRuta(evento?.data, ruta) ?? '').join('');
  return crypto
    .createHash('sha256')
    .update(`${valores}${evento?.timestamp ?? ''}${secreto}`)
    .digest('hex');
}

export class WompiServicio {
  constructor(deps = {}) {
    this.pagos = deps.pagos ?? new PagoWompiRepositorio();
    this.suscripcion = deps.suscripcion ?? suscripcionMarcaServicio;
    this.entorno = deps.entorno ?? process.env;
  }

  configurado() {
    return Boolean(this.entorno.WOMPI_LLAVE_PUBLICA && this.entorno.WOMPI_SECRETO_INTEGRIDAD);
  }

  async crearIntento(marcaId) {
    if (!this.configurado()) {
      return {
        error: 'Wompi aun no esta configurado en el servidor.',
        codigoHttp: 503,
      };
    }

    const referencia = `marca-${marcaId}-${Date.now()}`;
    await this.pagos.crear({
      marcaId,
      referencia,
      montoCentavos: MONTO_MENSUAL_CENTAVOS,
    });

    const integridad = firmaIntegridadWompi({
      referencia,
      montoCentavos: MONTO_MENSUAL_CENTAVOS,
      moneda: MONEDA,
      secreto: this.entorno.WOMPI_SECRETO_INTEGRIDAD,
    });

    const frontend = (this.entorno.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/$/, '');

    return {
      publicKey: this.entorno.WOMPI_LLAVE_PUBLICA,
      referencia,
      moneda: MONEDA,
      montoCentavos: MONTO_MENSUAL_CENTAVOS,
      precioMensual: PRECIO_MENSUAL_COP,
      integridad,
      redirectUrl: `${frontend}/admin/panel/`,
    };
  }

  async confirmarEvento(evento) {
    const secreto = this.entorno.WOMPI_SECRETO_EVENTOS;
    if (!secreto) {
      return { error: 'Falta el secreto de eventos de Wompi.', codigoHttp: 503 };
    }

    const esperado = firmaEventoWompi(evento, secreto);
    const recibido = String(evento?.signature?.checksum ?? '');
    const firmas = Buffer.from(esperado);
    const llega = Buffer.from(recibido);
    if (firmas.length !== llega.length || !crypto.timingSafeEqual(firmas, llega)) {
      return { error: 'Firma de Wompi invalida.', codigoHttp: 401 };
    }

    const transaccion = evento?.data?.transaction;
    if (!transaccion?.reference) {
      return { omitido: true };
    }

    const pago = await this.pagos.buscarPorReferencia(transaccion.reference);
    if (!pago) return { omitido: true };
    if (pago.estado === 'aprobado') return { yaAplicado: true };

    const estado = String(transaccion.status ?? '').toUpperCase();
    if (estado !== 'APPROVED') {
      if (estado === 'DECLINED' || estado === 'ERROR' || estado === 'VOIDED') {
        await this.pagos.marcar(transaccion.reference, 'rechazado', transaccion.id ?? null);
      }
      return { pendiente: estado !== 'APPROVED' };
    }

    if (Number(transaccion.amount_in_cents) !== Number(pago.monto_centavos)) {
      return { error: 'El monto no coincide con el plan.', codigoHttp: 409 };
    }
    if (String(transaccion.currency ?? MONEDA).toUpperCase() !== MONEDA) {
      return { error: 'La moneda no coincide.', codigoHttp: 409 };
    }

    const aplicado = await this.pagos.marcar(transaccion.reference, 'aprobado', transaccion.id ?? null);
    if (!aplicado) return { yaAplicado: true };

    await this.suscripcion.renovarPlan(pago.marca_id, {
      plan_tipo: 'mensual',
      monto: PRECIO_MENSUAL_COP,
    });

    return { aprobado: true, marcaId: pago.marca_id };
  }
}

export const wompiServicio = new WompiServicio();
