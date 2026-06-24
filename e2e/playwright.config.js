import { defineConfig, devices } from '@playwright/test';

const puertoFront = Number(process.env.E2E_PORT ?? 5173);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${puertoFront}`;

const envBd = {
  NODE_ENV: 'desarrollo',
  DB_HOST: process.env.DB_HOST ?? '127.0.0.1',
  DB_PUERTO: process.env.DB_PUERTO ?? '3306',
  DB_USUARIO: process.env.DB_USUARIO ?? 'root',
  DB_CONTRASENA: process.env.DB_CONTRASENA ?? '',
  DB_NOMBRE: process.env.DB_NOMBRE ?? 'spa_unas',
  PLATAFORMA_HABILITADA: 'false',
  LOG_NIVEL: 'error',
};

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  webServer: process.env.CI
    ? [
        {
          command: 'npm start',
          cwd: '../backend',
          url: 'http://127.0.0.1:3001/api/estado',
          reuseExistingServer: false,
          timeout: 120_000,
          env: { ...envBd, PUERTO: '3001' },
        },
        {
          command: `npm run dev -- --host 127.0.0.1 --port ${puertoFront}`,
          cwd: '../frontend',
          url: baseURL,
          reuseExistingServer: false,
          timeout: 120_000,
        },
      ]
    : undefined,
});
