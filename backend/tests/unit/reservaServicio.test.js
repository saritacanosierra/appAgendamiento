import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ReservaServicio } from '../../src/servicios/reservaServicio.js';

describe('ReservaServicio.crearReservaPublica', () => {
  it('valida campos obligatorios sin consultar la BD', async () => {
    const servicio = new ReservaServicio({
      marcaRepo: {
        buscarPorIdCompleto: async () => {
          throw new Error('No debe consultar BD en validacion');
        },
      },
    });

    const resultado = await servicio.crearReservaPublica({});

    assert.equal(resultado.codigoHttp, 422);
    assert.ok(resultado.error);
    assert.ok(resultado.errores.marca_id);
    assert.ok(resultado.errores.servicio_id);
    assert.ok(resultado.errores.nombre);
  });

  it('rechaza correo invalido antes de persistir', async () => {
    const servicio = new ReservaServicio({
      marcaRepo: {
        buscarPorIdCompleto: async () => {
          throw new Error('No debe consultar BD');
        },
      },
    });

    const resultado = await servicio.crearReservaPublica({
      marca_id: 1,
      servicio_id: 2,
      fecha: '2030-06-15',
      hora_inicio: '10:00',
      nombre: 'Cliente Test',
      telefono: '3001234567',
      correo: 'correo-mal-formado',
    });

    assert.equal(resultado.codigoHttp, 422);
    assert.ok(resultado.errores.correo);
  });
});
