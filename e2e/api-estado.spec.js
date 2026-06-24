import { test, expect } from '@playwright/test';

test('API estado responde operativa', async ({ request }) => {
  const respuesta = await request.get('http://127.0.0.1:3001/api/estado');
  expect(respuesta.ok()).toBeTruthy();

  const cuerpo = await respuesta.json();
  expect(cuerpo.exito).toBe(true);
  expect(cuerpo.datos.version).toBeTruthy();
});
