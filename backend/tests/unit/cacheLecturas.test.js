import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { crearCache } from '../../src/utilidades/cacheLecturas.js';

describe('crearCache (memoria)', () => {
  it('cachea el resultado y no vuelve a cargar dentro del TTL', async () => {
    let cargas = 0;
    const cache = crearCache({ ttlMs: 5_000, prefijo: 'test' });

    const a = await cache.obtener('servicios:1', async () => {
      cargas += 1;
      return ['manicure'];
    });
    const b = await cache.obtener('servicios:1', async () => {
      cargas += 1;
      return ['otra'];
    });

    assert.deepEqual(a, ['manicure']);
    assert.deepEqual(b, ['manicure']);
    assert.equal(cargas, 1);
  });

  it('comparte una sola carga si hay llamadas paralelas', async () => {
    let cargas = 0;
    const cache = crearCache({ ttlMs: 5_000, prefijo: 'test-par' });

    const promesas = Array.from({ length: 8 }, () =>
      cache.obtener('marca:9', async () => {
        cargas += 1;
        await new Promise((r) => setTimeout(r, 20));
        return { id: 9 };
      })
    );

    const valores = await Promise.all(promesas);
    assert.equal(cargas, 1);
    assert.ok(valores.every((v) => v.id === 9));
  });

  it('aisla claves distintas (multi-marca)', async () => {
    const cache = crearCache({ ttlMs: 5_000, prefijo: 'test-marca' });
    const a = await cache.obtener('servicios:1', async () => 'luna');
    const b = await cache.obtener('servicios:2', async () => 'dani');
    assert.equal(a, 'luna');
    assert.equal(b, 'dani');
  });

  it('propaga el error y permite reintentar', async () => {
    const cache = crearCache({ ttlMs: 5_000, prefijo: 'test-err' });
    let intentos = 0;

    await assert.rejects(
      () => cache.obtener('x', async () => {
        intentos += 1;
        throw new Error('boom');
      }),
      /boom/
    );

    const valor = await cache.obtener('x', async () => {
      intentos += 1;
      return 'ok';
    });

    assert.equal(valor, 'ok');
    assert.equal(intentos, 2);
  });
});
