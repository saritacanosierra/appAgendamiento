import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { limitarTasa } from '../../src/middlewares/limitarTasa.js';
import { crearMockNext, crearMockReq, crearMockRes } from '../helpers/mockHttp.js';

describe('limitarTasa (memoria)', () => {
  it('deja pasar debajo del maximo y responde 429 al superar', async () => {
    const claveUnica = `/test-rl-${Date.now()}-${Math.random()}`;
    const middleware = limitarTasa({
      ventanaMs: 60_000,
      max: 2,
      mensaje: 'Demasiado.',
    });

    for (let i = 0; i < 2; i += 1) {
      const req = crearMockReq({ path: claveUnica, ip: '10.0.0.8' });
      req.path = claveUnica;
      const res = crearMockRes();
      const next = crearMockNext();
      await middleware(req, res, next);
      assert.equal(next.wasCalled(), true);
      assert.equal(res.statusCode, 200);
    }

    const req = crearMockReq({ path: claveUnica, ip: '10.0.0.8' });
    req.path = claveUnica;
    const res = crearMockRes();
    const next = crearMockNext();
    await middleware(req, res, next);

    assert.equal(next.wasCalled(), false);
    assert.equal(res.statusCode, 429);
    assert.equal(res.body.exito, false);
    assert.match(res.body.mensaje, /Demasiado/);
  });
});
