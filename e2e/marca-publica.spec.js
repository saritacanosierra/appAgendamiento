import { test, expect } from '@playwright/test';

const SLUG = process.env.E2E_MARCA_SLUG ?? 'luna-nails';

test.describe('Sitio publico de marca', () => {
  test('carga inicio con CTA de reserva', async ({ page }) => {
    await page.goto(`/m/${SLUG}/`);

    await expect(page.getByRole('link', { name: 'Agendar cita' })).toBeVisible();
    await expect(page.getByText('Tu momento de cuidado personal')).toBeVisible();
  });

  test('pagina reservar muestra selector de servicios', async ({ page }) => {
    await page.goto(`/m/${SLUG}/reservar/`);

    await expect(page.getByRole('heading', { name: 'Elige un servicio' })).toBeVisible();
  });
});
