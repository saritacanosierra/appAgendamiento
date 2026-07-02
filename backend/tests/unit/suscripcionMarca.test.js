import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularVencimiento,
  diasEntre,
  planEstaVencido,
  mapearEstadoSuscripcion,
  normalizarFechaISO,
} from '../../src/utilidades/suscripcionMarca.js';

describe('suscripcionMarca', () => {
  it('normaliza fechas ISO', () => {
    assert.equal(normalizarFechaISO('2026-06-15'), '2026-06-15');
    assert.equal(normalizarFechaISO('2026-06-15T10:00:00'), '2026-06-15');
    assert.equal(normalizarFechaISO(null), null);
  });

  it('calcula vencimiento mensual', () => {
    assert.equal(calcularVencimiento('2026-01-15', 'mensual'), '2026-02-15');
    assert.equal(calcularVencimiento('2026-01-15', 'anual'), '2027-01-15');
  });

  it('detecta plan vencido', () => {
    const marcaVencida = { plan_vence_en: '2020-01-01' };
    assert.equal(planEstaVencido(marcaVencida), true);
  });

  it('mapea estado vigente', () => {
    const futuro = new Date();
    futuro.setUTCMonth(futuro.getUTCMonth() + 2);
    const iso = futuro.toISOString().slice(0, 10);

    const estado = mapearEstadoSuscripcion({
      plan_tipo: 'mensual',
      plan_vence_en: iso,
      plan_habilitado: 1,
      plan_inicio_en: '2026-01-01',
    });

    assert.equal(estado.vigente, true);
    assert.equal(estado.vencido, false);
    assert.equal(estado.tipoEtiqueta, 'Mensual');
  });

  it('calcula dias entre fechas', () => {
    assert.equal(diasEntre('2026-06-01', '2026-06-11'), 10);
  });
});
