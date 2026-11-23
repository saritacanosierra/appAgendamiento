import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  redirectPagoWompi,
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
      secretoIntegridadActual: 'test_integrity_viejo',
    });
    assert.equal(ok.llavePublica, 'pub_test_abc');
    assert.equal(ok.secretoIntegridad, 'test_integrity_viejo');
  });

  it('rechaza una llave publica invalida', () => {
    const resultado = validarLlavesWompi({
      llavePublica: 'llave-rara',
      secretoIntegridadNuevo: 'x',
      secretoIntegridadActual: '',
    });
    assert.equal(resultado.codigoHttp, 422);
  });

  it('rechaza mezclar prod y test', () => {
    const resultado = validarLlavesWompi({
      llavePublica: 'pub_prod_abc',
      secretoIntegridadNuevo: 'test_integrity_xyz',
      secretoIntegridadActual: '',
    });
    assert.equal(resultado.codigoHttp, 422);
  });

  it('acepta solo retorno al panel admin', () => {
    assert.equal(
      redirectPagoWompi('https://ritualnails.store/admin/panel', 'http://localhost:5173/admin/panel/'),
      'https://ritualnails.store/admin/panel/'
    );
    assert.equal(
      redirectPagoWompi('https://evil.test/', 'http://localhost:5173/admin/panel/'),
      'http://localhost:5173/admin/panel/'
    );
  });

  it('resuelve el secreto de eventos sin borrar el actual', () => {
    assert.equal(resolverSecretoEventos('', 'evt_viejo'), 'evt_viejo');
    assert.equal(resolverSecretoEventos('evt_nuevo', 'evt_viejo'), 'evt_nuevo');
  });
});
