import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { WhatsappServicio } from '../../src/servicios/whatsappServicio.js';

const credencialesOk = {
  marcaId: 1,
  configurado: true,
  phoneNumberId: '123456789',
  token: 'token-prueba',
  codigoPais: '52',
  numeroPublico: '+525512345678',
};

describe('WhatsappServicio', () => {
  let fetchOriginal;

  beforeEach(() => {
    fetchOriginal = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = fetchOriginal;
  });

  it('omite envio sin telefono', async () => {
    const servicio = new WhatsappServicio();
    const resultado = await servicio.enviarTexto({
      telefono: '',
      mensaje: 'Hola',
      credenciales: credencialesOk,
    });
    assert.equal(resultado.omitido, true);
    assert.equal(resultado.motivo, 'sin_telefono');
  });

  it('omite envio sin mensaje', async () => {
    const servicio = new WhatsappServicio();
    const resultado = await servicio.enviarTexto({
      telefono: '5512345678',
      mensaje: '   ',
      credenciales: credencialesOk,
    });
    assert.equal(resultado.omitido, true);
    assert.equal(resultado.motivo, 'sin_mensaje');
  });

  it('simula envio si la marca no tiene credenciales', async () => {
    const servicio = new WhatsappServicio();
    const resultado = await servicio.enviarTexto({
      telefono: '5512345678',
      mensaje: 'Prueba',
      credenciales: { marcaId: 1, configurado: false },
    });
    assert.equal(resultado.omitido, true);
    assert.equal(resultado.motivo, 'whatsapp_marca_no_configurado');
  });

  it('normaliza telefono de 10 digitos con codigo de pais', async () => {
    let cuerpoEnviado;
    globalThis.fetch = async (_url, opciones) => {
      cuerpoEnviado = JSON.parse(opciones.body);
      return {
        ok: true,
        json: async () => ({ messages: [{ id: 'wamid.test' }] }),
      };
    };

    const servicio = new WhatsappServicio();
    const resultado = await servicio.enviarTexto({
      telefono: '5512345678',
      mensaje: 'Hola cliente',
      credenciales: credencialesOk,
    });

    assert.equal(resultado.enviado, true);
    assert.equal(resultado.destino, '525512345678');
    assert.equal(cuerpoEnviado.to, '525512345678');
  });

  it('envia confirmacion de reserva con codigo', async () => {
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ messages: [{ id: 'wamid.confirmacion' }] }),
    });

    const servicio = new WhatsappServicio();
    const resultado = await servicio.enviarConfirmacionReserva({
      confirmacion: {
        mensajeConfirmacion: 'Tu cita esta confirmada',
        cita: {
          codigo: 'ABC123',
          cliente: { telefono: '5512345678' },
        },
      },
      urlConfirmacion: 'https://ejemplo.com/cita',
      credenciales: credencialesOk,
    });

    assert.equal(resultado.enviado, true);
    assert.equal(resultado.destino, '525512345678');
  });

  it('usa plantilla para recordatorio cuando esta configurada', async () => {
    let cuerpoEnviado;
    globalThis.fetch = async (_url, opciones) => {
      cuerpoEnviado = JSON.parse(opciones.body);
      return {
        ok: true,
        json: async () => ({ messages: [{ id: 'wamid.plantilla' }] }),
      };
    };

    const servicio = new WhatsappServicio();
    const resultado = await servicio.enviarRecordatorioCita({
      telefono: '5512345678',
      clienteNombre: 'Maria Lopez',
      marcaNombre: 'Luna Nails',
      servicioNombre: 'Manicure',
      fecha: '2030-06-15',
      horaInicio: '10:00',
      codigo: 'XYZ99',
      credenciales: {
        ...credencialesOk,
        plantillaRecordatorio: 'recordatorio_cita',
        plantillaIdioma: 'es_MX',
      },
    });

    assert.equal(resultado.enviado, true);
    assert.equal(cuerpoEnviado.type, 'template');
    assert.equal(cuerpoEnviado.template.name, 'recordatorio_cita');
  });
});
