import { test, expect } from '@playwright/test';

const SLUG = process.env.E2E_MARCA_SLUG ?? 'luna-nails';

async function seleccionarPrimerHorarioDisponible(page) {
  const horarios = page.locator('.selector-hora-grid__pill');
  await expect(horarios.first()).toBeVisible({ timeout: 15_000 });
  await horarios.first().click();
}

async function seleccionarDiaConHorarios(page) {
  const celdas = page.locator('.calendario-mes__celda:not(.calendario-mes__celda--deshabilitada)');

  for (let intento = 0; intento < 14; intento += 1) {
    const horarios = page.locator('.selector-hora-grid__pill');
    if (await horarios.count()) {
      await seleccionarPrimerHorarioDisponible(page);
      return;
    }

    const indice = Math.min(intento + 1, (await celdas.count()) - 1);
    if (indice < 1) break;
    await celdas.nth(indice).click();
    await page.waitForTimeout(600);
  }

  await seleccionarPrimerHorarioDisponible(page);
}

test.describe('Flujo reserva publica completo', () => {
  test('reserva servicio hasta confirmacion', async ({ page }) => {
    const sufijo = Date.now();
    const correo = `e2e-reserva-${sufijo}@test.local`;

    await page.goto(`/m/${SLUG}/reservar/`);

    await expect(page.getByRole('heading', { name: 'Elige un servicio' })).toBeVisible();
    await page.getByRole('button', { name: 'Elegir' }).first().click();

    await expect(page.getByRole('heading', { name: 'Fecha y hora' })).toBeVisible();
    await seleccionarDiaConHorarios(page);

    await page.getByRole('button', { name: 'Continuar' }).click();

    await expect(page.getByRole('heading', { name: 'Tus datos' })).toBeVisible();
    await page.locator('#nombre').fill('Cliente E2E Test');
    await page.locator('#telefono').fill('3001234567');
    await page.locator('#correo').fill(correo);
    await page.getByRole('button', { name: 'Continuar' }).click();

    await expect(page.getByRole('heading', { name: 'Confirma tu cita' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar reserva' }).click();

    await expect(page).toHaveURL(new RegExp(`/m/${SLUG}/confirmacion/[A-Za-z0-9-]+/?$`), {
      timeout: 15_000,
    });
    await expect(page.getByRole('heading', { name: '¡Cita confirmada!' })).toBeVisible();
    await expect(page.locator('.confirmacion-reserva__codigo')).not.toBeEmpty();
  });
});
