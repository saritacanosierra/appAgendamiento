import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  armarResumenPremio,
  precioConDescuento,
  validarPremioConfig,
} from '../../src/utilidades/premioPuntos.js';

describe('premio por puntos', () => {
  it('exige puntos y porcentaje juntos', () => {
    assert.equal(validarPremioConfig('', '').premio, null);
    assert.ok(validarPremioConfig('100', '').error);
    assert.deepEqual(validarPremioConfig('100', '15').premio, {
      puntosNecesarios: 100,
      porcentaje: 15,
    });
  });

  it('conserva el total y reinicia solo los puntos del premio', () => {
    const resumen = armarResumenPremio({
      puntosTotales: 130,
      puntosCanjeados: 100,
      serviciosCompletados: 13,
      puntosNecesarios: 100,
      porcentaje: 15,
    });
    assert.equal(resumen.puntosTotales, 130);
    assert.equal(resumen.puntosDisponibles, 30);
    assert.equal(resumen.alcanza, false);
  });

  it('deja el descuento listo al llegar a los puntos y lo aparta si ya hay uno pendiente', () => {
    const listo = armarResumenPremio({
      puntosTotales: 100,
      puntosCanjeados: 0,
      puntosNecesarios: 100,
      porcentaje: 10,
    });
    assert.equal(listo.alcanza, true);
    assert.equal(listo.puntosTotales, 100);

    const apartado = armarResumenPremio({
      puntosTotales: 100,
      puntosCanjeados: 0,
      puntosNecesarios: 100,
      porcentaje: 10,
      pendiente: { id: 4, cita_id: 9, puntos_usados: 100, porcentaje: 10 },
    });
    assert.equal(apartado.alcanza, false);
    assert.equal(apartado.premioPendiente.citaId, 9);
    assert.equal(apartado.puntosTotales, 100);
  });

  it('aplica el porcentaje sobre el precio de la cita', () => {
    assert.equal(precioConDescuento(80000, 15), 68000);
  });
});
