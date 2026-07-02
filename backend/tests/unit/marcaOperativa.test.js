import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { verificarMarcaOperativa } from '../../src/utilidades/marcaOperativa.js';

describe('verificarMarcaOperativa', () => {
  const marcaOk = {
    activa: 1,
    plan_habilitado: 1,
    plan_vence_en: '2099-12-31',
  };

  it('permite marca activa con plan vigente', () => {
    assert.deepEqual(verificarMarcaOperativa(marcaOk), { ok: true });
  });

  it('rechaza marca suspendida', () => {
    const resultado = verificarMarcaOperativa({ ...marcaOk, activa: 0 });
    assert.equal(resultado.ok, false);
    assert.equal(resultado.codigo, 'marca_suspendida');
  });

  it('rechaza plan inactivo', () => {
    const resultado = verificarMarcaOperativa({ ...marcaOk, plan_habilitado: 0 });
    assert.equal(resultado.ok, false);
    assert.equal(resultado.codigo, 'plan_inactivo');
  });

  it('rechaza plan vencido', () => {
    const resultado = verificarMarcaOperativa({
      ...marcaOk,
      plan_vence_en: '2020-01-01',
    });
    assert.equal(resultado.ok, false);
    assert.equal(resultado.codigo, 'plan_vencido');
  });

  it('rechaza marca inexistente', () => {
    const resultado = verificarMarcaOperativa(null);
    assert.equal(resultado.codigoHttp, 404);
  });
});
