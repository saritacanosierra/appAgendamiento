import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { aislamientoMarcaMiddleware } from '../../src/middlewares/aislamientoMarcaMiddleware.js';
import { crearMockNext, crearMockReq, crearMockRes } from '../helpers/mockHttp.js';

describe('aislamientoMarcaMiddleware', () => {
  it('rechaza si no hay marca en sesion', () => {
    const req = crearMockReq({ marcaId: null });
    const res = crearMockRes();
    const next = crearMockNext();

    aislamientoMarcaMiddleware(req, res, next);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.exito, false);
    assert.equal(next.wasCalled(), false);
  });

  it('permite continuar si no se envia marca_id distinto', () => {
    const req = crearMockReq({ marcaId: 3, body: { nombre: 'Cita' } });
    const res = crearMockRes();
    const next = crearMockNext();

    aislamientoMarcaMiddleware(req, res, next);

    assert.equal(next.wasCalled(), true);
    assert.equal(res.body, null);
  });

  it('rechaza marca_id en body distinto a la sesion', () => {
    const req = crearMockReq({ marcaId: 3, body: { marca_id: 99 } });
    const res = crearMockRes();
    const next = crearMockNext();

    aislamientoMarcaMiddleware(req, res, next);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.mensaje, 'Acceso denegado.');
    assert.equal(next.wasCalled(), false);
  });

  it('permite marca_id en query igual a la sesion', () => {
    const req = crearMockReq({ marcaId: 7, query: { marca_id: '7' } });
    const res = crearMockRes();
    const next = crearMockNext();

    aislamientoMarcaMiddleware(req, res, next);

    assert.equal(next.wasCalled(), true);
  });

  it('rechaza marcaId camelCase distinto a la sesion', () => {
    const req = crearMockReq({ marcaId: 2, body: { marcaId: 5 } });
    const res = crearMockRes();
    const next = crearMockNext();

    aislamientoMarcaMiddleware(req, res, next);

    assert.equal(res.statusCode, 403);
  });
});
