import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolverSecretoEventos,
  urlEventosWompi,
  validarLlavesWompi,
} from '../../src/utilidades/wompiConfig.js';

describe('Wompi config plataforma', () => {
  it('arma la url de eventos con PUBLIC_URL_BASE', () => {
    assert.equal(
      urlEventosWompi({ PUBLIC_URL_BASE: 'https://appagendamiento.onrender.com/' }),
      'https://appagendamiento.onrender.com/api/webhooks/wompi'
    );
  });

  it('acepta llaves validas y reusa el secreto guardado', () => {
    const ok = validarLlavesWompi({
      llavePublica: 'pub_test_abc',
      secretoIntegridadNuevo: '',
      secretoIntegridadActual: 'secreto-viejo',
    });
    assert.equal(ok.llavePublica, 'pub_test_abc');
    assert.equal(ok.secretoIntegridad, 'secreto-viejo');
  });

  it('rechaza una llave publica invalida', () => {
    const resultado = validarLlavesWompi({
      llavePublica: 'llave-rara',
      secretoIntegridadNuevo: 'x',
      secretoIntegridadActual: '',
    });
    assert.equal(resultado.codigoHttp, 422);
  });

  it('resuelve el secreto de eventos sin borrar el actual', () => {
    assert.equal(resolverSecretoEventos('', 'evt_viejo'), 'evt_viejo');
    assert.equal(resolverSecretoEventos('evt_nuevo', 'evt_viejo'), 'evt_nuevo');
  });
});
