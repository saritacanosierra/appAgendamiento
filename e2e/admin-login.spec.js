import { test, expect } from '@playwright/test';

const CORREO = process.env.E2E_ADMIN_CORREO ?? 'admin@lunanails.test';
const CONTRASENA = process.env.E2E_ADMIN_CONTRASENA ?? 'Admin123!';

test.describe('Login admin marca', () => {
  test('accede al panel con credenciales validas', async ({ page }) => {
    await page.goto('/admin/');
    await page.locator('#correo').fill(CORREO);
    await page.locator('#contrasena').fill(CONTRASENA);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL(/\/admin\/panel\/?$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('muestra error con contrasena incorrecta', async ({ page }) => {
    await page.goto('/admin/');
    await page.locator('#correo').fill(CORREO);
    await page.locator('#contrasena').fill('contrasena-invalida');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/?$/);
  });
});
