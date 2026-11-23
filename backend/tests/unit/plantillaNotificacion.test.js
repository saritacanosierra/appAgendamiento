import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  motivoAvisoLegible,
  renderPlantillaHtml,
  renderPlantillaTexto,
  valoresPlantillaCita,
} from '../../src/utilidades/plantillaNotificacion.js';

describe('plantillaNotificacion', () => {
  it('reemplaza variables en texto', () => {
    const valores = valoresPlantillaCita({
      nombre: 'Ana',
      marca: 'Beauty Nails',
      servicio: 'Manicure',
      fecha: '2026-11-24',
      hora: '10:00',
      codigo: 'ABC123',
      urlConfirmacion: 'https://ejemplo.test/m/x/confirmacion/ABC123',
    });
    const texto = renderPlantillaTexto(
      'Hola {{nombre}} en {{marca}} — {{codigo}}',
      valores
    );
    assert.equal(texto, 'Hola Ana en Beauty Nails — ABC123');
  });

  it('escapa HTML en variables', () => {
    const html = renderPlantillaHtml('<p>{{nombre}}</p>', {
      nombre: '<script>x</script>',
    });
    assert.equal(html, '<p>&lt;script&gt;x&lt;/script&gt;</p>');
  });

  it('traduce motivos legibles', () => {
    assert.match(motivoAvisoLegible('cliente_sin_correo'), /correo/i);
    assert.match(motivoAvisoLegible('smtp_no_configurado'), /SMTP|buzon|correo/i);
  });
});
