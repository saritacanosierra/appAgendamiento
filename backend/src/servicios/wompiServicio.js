import crypto from 'crypto';
import { PagoWompiRepositorio } from '../repositorios/pagoWompiRepositorio.js';
import { ConfiguracionPlataformaRepositorio } from '../repositorios/plataformaRepositorio.js';
import { suscripcionMarcaServicio } from './suscripcionMarcaServicio.js';
import { precioPlanCop, listarPlanesCobro } from '../utilidades/suscripcionMarca.js';
import {
  CLAVES_WOMPI,
  resolverSecretoEventos,
  textoWompi,
  redirectPagoWompi,
  urlEventosWompi,
  validarLlavesWompi,
} from '../utilidades/wompiConfig.js';

const MONEDA = 'COP';

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

export { urlEventosWompi, CLAVES_WOMPI };

export class WompiServicio {
  constructor(deps = {}) {
    this.pagos = deps.pagos ?? new PagoWompiRepositorio();
    this.suscripcion = deps.suscripcion ?? suscripcionMarcaServicio;
    this.config = deps.config ?? new ConfiguracionPlataformaRepositorio();
    this.entorno = deps.entorno ?? process.env;
  }

  async #valor(claveBd, claveEnv) {
    const guardado = textoWompi(await this.config.obtener(claveBd));
    if (guardado) return { valor: guardado, fuente: 'plataforma' };
    const entorno = textoWompi(this.entorno[claveEnv]);
    if (entorno) return { valor: entorno, fuente: 'entorno' };
    return { valor: '', fuente: 'ninguna' };
  }

  async leerCredenciales() {
    const [publica, integridad, eventos] = await Promise.all([
      this.#valor(CLAVES_WOMPI.llavePublica, 'WOMPI_LLAVE_PUBLICA'),
      this.#valor(CLAVES_WOMPI.secretoIntegridad, 'WOMPI_SECRETO_INTEGRIDAD'),
      this.#valor(CLAVES_WOMPI.secretoEventos, 'WOMPI_SECRETO_EVENTOS'),
    ]);
    return {
      publicKey: publica.valor,
      secretoIntegridad: integridad.valor,
      secretoEventos: eventos.valor,
      fuentes: {
        llavePublica: publica.fuente,
        secretoIntegridad: integridad.fuente,
        secretoEventos: eventos.fuente,
      },
    };
  }

  async configurado() {
    const credenciales = await this.leerCredenciales();
    return Boolean(credenciales.publicKey && credenciales.secretoIntegridad);
  }

  async obtenerConfigPlataforma() {
    const credenciales = await this.leerCredenciales();
    return {
      listo: Boolean(credenciales.publicKey && credenciales.secretoIntegridad),
      eventosListos: Boolean(credenciales.secretoEventos),
      llavePublica: credenciales.publicKey,
      secretoIntegridadGuardado: Boolean(credenciales.secretoIntegridad),
      secretoEventosGuardado: Boolean(credenciales.secretoEventos),
      urlEventos: urlEventosWompi(this.entorno),
      planes: listarPlanesCobro(),
    };
  }

  async guardarConfigPlataforma(datos = {}) {
    const actual = await this.leerCredenciales();
    const validado = validarLlavesWompi({
      llavePublica: datos.llave_publica ?? datos.llavePublica,
      secretoIntegridadNuevo: datos.secreto_integridad ?? datos.secretoIntegridad,
      secretoIntegridadActual: actual.secretoIntegridad,
    });
    if (validado.error) return validado;

    const secretoEventos = resolverSecretoEventos(
      datos.secreto_eventos ?? datos.secretoEventos,
      actual.secretoEventos
    );

    await this.config.guardar(CLAVES_WOMPI.llavePublica, validado.llavePublica);
    await this.config.guardar(CLAVES_WOMPI.secretoIntegridad, validado.secretoIntegridad);
    if (secretoEventos) {
      await this.config.guardar(CLAVES_WOMPI.secretoEventos, secretoEventos);
    }

    return this.obtenerConfigPlataforma();
  }

  async crearIntento(marcaId, planTipo, opciones = {}) {
    const credenciales = await this.leerCredenciales();
    if (!credenciales.publicKey || !credenciales.secretoIntegridad) {
      return {
        error: 'Wompi aun no esta configurado en el servidor.',
        codigoHttp: 503,
      };
    }

    const tipoOk = this.suscripcion.validarTipoPlan(planTipo);
    if (tipoOk.error) return tipoOk;

    const precio = precioPlanCop(tipoOk.tipo);
    const montoCentavos = precio * 100;
    const referencia = `marca-${marcaId}-${tipoOk.tipo}-${Date.now()}`;
    await this.pagos.crear({
      marcaId,
      referencia,
      montoCentavos,
      planTipo: tipoOk.tipo,
    });

    const integridad = firmaIntegridadWompi({
      referencia,
      montoCentavos,
      moneda: MONEDA,
      secreto: credenciales.secretoIntegridad,
    });

    const frontend = (this.entorno.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/$/, '');
    const redirectUrl = redirectPagoWompi(
      opciones.redirect_url ?? opciones.redirectUrl,
      `${frontend}/admin/panel/`
    );

    return {
      publicKey: credenciales.publicKey,
      referencia,
      moneda: MONEDA,
      montoCentavos,
      planTipo: tipoOk.tipo,
      precio,
      integridad,
      redirectUrl,
    };
  }

  async confirmarEvento(evento) {
    const credenciales = await this.leerCredenciales();
    const secreto = credenciales.secretoEventos;
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

    const planTipo = pago.plan_tipo || 'mensual';
    await this.suscripcion.renovarPlan(pago.marca_id, {
      plan_tipo: planTipo,
      monto: precioPlanCop(planTipo),
    });

    return { aprobado: true, marcaId: pago.marca_id };
  }
}

export const wompiServicio = new WompiServicio();
