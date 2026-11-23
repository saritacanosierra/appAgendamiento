import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  adquirirCandadoAgendaDia,
  claveEstilistaCandado,
} from '../../src/utilidades/candadoAgenda.js';

describe('candadoAgenda', () => {
  it('normaliza estilista ausente a 0', () => {
    assert.equal(claveEstilistaCandado(null), 0);
    assert.equal(claveEstilistaCandado(undefined), 0);
    assert.equal(claveEstilistaCandado(''), 0);
    assert.equal(claveEstilistaCandado(12), 12);
  });

  it('inserta candado y bloquea con FOR UPDATE', async () => {
    const llamadas = [];
    const conexion = {
      execute: async (sql, params) => {
        llamadas.push({ sql, params });
        if (sql.includes('INSERT IGNORE')) return [{ affectedRows: 1 }];
        if (sql.includes('FOR UPDATE')) return [[{ id: 7 }]];
        throw new Error(`SQL inesperado: ${sql}`);
      },
    };

    const id = await adquirirCandadoAgendaDia(conexion, {
      marcaId: 3,
      fecha: '2030-01-15',
      estilistaId: 9,
    });

    assert.equal(id, 7);
    assert.equal(llamadas.length, 2);
    assert.match(llamadas[0].sql, /INSERT IGNORE/);
    assert.deepEqual(llamadas[0].params, [3, '2030-01-15', 9]);
    assert.match(llamadas[1].sql, /FOR UPDATE/);
  });

  it('falla si no hay fila de candado', async () => {
    const conexion = {
      execute: async (sql) => {
        if (sql.includes('INSERT IGNORE')) return [{ affectedRows: 0 }];
        return [[]];
      },
    };

    await assert.rejects(
      () => adquirirCandadoAgendaDia(conexion, { marcaId: 1, fecha: '2030-01-01' }),
      (err) => err.codigoHttp === 503
    );
  });
});
