import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AvisosConfirmacionServicio,
  normalizarResultadoAviso,
} from '../../src/servicios/avisosConfirmacionServicio.js';

describe('normalizarResultadoAviso', () => {
  it('marca enviado cuando llega ok', () => {
    const r = normalizarResultadoAviso('whatsapp', { enviado: true });
    assert.equal(r.estado, 'enviado');
    assert.equal(r.canal, 'whatsapp');
  });

  it('marca omitido con motivo legible', () => {
    const r = normalizarResultadoAviso('correo', {
      omitido: true,
      motivo: 'smtp_no_configurado',
    });
    assert.equal(r.estado, 'omitido');
    assert.equal(r.motivoCodigo, 'smtp_no_configurado');
    assert.ok(r.motivo);
  });

  it('marca error si el resultado es nulo', () => {
    const r = normalizarResultadoAviso('whatsapp', null);
    assert.equal(r.estado, 'error');
  });
});

describe('AvisosConfirmacionServicio.enviarTrasReserva', () => {
  const confirmacion = {
    cita: {
      id: 44,
      marca: {
        whatsapp: '3001112233',
        telefono: '6012345678',
        nombreComercial: 'Luna Nails',
      },
    },
  };

  it('no envia nada si ambos canales estan apagados', async () => {
    const servicio = new AvisosConfirmacionServicio({
      correoMarca: {
        leerCanales: async () => ({ whatsapp: false, correo: false }),
      },
      registrarFallo: async () => {
        throw new Error('No debe registrar fallo');
      },
    });

    const r = await servicio.enviarTrasReserva({
      marcaId: 1,
      confirmacion,
      urlConfirmacion: 'https://ejemplo.test/c',
    });

    assert.deepEqual(r.resultados, []);
    assert.equal(r.contactarDirecto, false);
    assert.equal(r.contacto, null);
  });

  it('omite WhatsApp si no hay credenciales y pide contactar directo', async () => {
    let falloRegistrado = false;
    const servicio = new AvisosConfirmacionServicio({
      correoMarca: {
        leerCanales: async () => ({ whatsapp: true, correo: false }),
      },
      whatsappMarca: {
        obtenerCredenciales: async () => ({ configurado: false }),
      },
      registrarFallo: async () => {
        falloRegistrado = true;
      },
    });

    const r = await servicio.enviarTrasReserva({
      marcaId: 2,
      confirmacion,
      urlConfirmacion: 'https://ejemplo.test/c',
    });

    assert.equal(r.resultados.length, 1);
    assert.equal(r.resultados[0].canal, 'whatsapp');
    assert.equal(r.resultados[0].estado, 'omitido');
    assert.equal(r.contactarDirecto, true);
    assert.equal(r.contacto.whatsapp, '3001112233');
    assert.equal(falloRegistrado, true);
  });

  it('envia correo cuando SMTP esta listo', async () => {
    let payloadSmtp = null;
    const servicio = new AvisosConfirmacionServicio({
      correoMarca: {
        leerCanales: async () => ({ whatsapp: false, correo: true }),
        obtenerCredencialesEnvio: async () => ({
          listo: true,
          smtp: { host: 'smtp.gmail.com', usuario: 'a@b.com' },
        }),
      },
      email: {
        enviarConfirmacionReservaMarca: async (payload) => {
          payloadSmtp = payload;
          return { enviado: true };
        },
      },
      registrarFallo: async () => {
        throw new Error('No debe registrar fallo si envio ok');
      },
    });

    const r = await servicio.enviarTrasReserva({
      marcaId: 3,
      confirmacion,
      urlConfirmacion: 'https://ejemplo.test/ok',
    });

    assert.equal(r.resultados[0].estado, 'enviado');
    assert.equal(r.contactarDirecto, false);
    assert.equal(payloadSmtp.smtp.host, 'smtp.gmail.com');
  });

  it('si WhatsApp falla y correo llega, contactarDirecto sigue true', async () => {
    const servicio = new AvisosConfirmacionServicio({
      correoMarca: {
        leerCanales: async () => ({ whatsapp: true, correo: true }),
        obtenerCredencialesEnvio: async () => ({
          listo: true,
          smtp: { host: 'smtp.test' },
        }),
      },
      whatsappMarca: {
        obtenerCredenciales: async () => ({ configurado: true, phoneNumberId: '1', token: 't' }),
      },
      whatsapp: {
        enviarConfirmacionReserva: async () => {
          throw new Error('Meta caido');
        },
      },
      email: {
        enviarConfirmacionReservaMarca: async () => ({ enviado: true }),
      },
      registrarFallo: async () => {},
    });

    const r = await servicio.enviarTrasReserva({
      marcaId: 4,
      confirmacion,
      urlConfirmacion: 'https://ejemplo.test/mix',
    });

    assert.equal(r.resultados.length, 2);
    assert.equal(r.resultados[0].estado, 'error');
    assert.equal(r.resultados[1].estado, 'enviado');
    assert.equal(r.contactarDirecto, true);
  });
});
