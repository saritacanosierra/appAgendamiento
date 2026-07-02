#!/usr/bin/env node
/**
 * Verifica salud de la API en produccion (cron o monitor externo).
 * Uso: node scripts/verificar-salud-produccion.js
 * Exit 0 = operativa, 1 = problema.
 */
const urlBase = (process.env.SALUD_API_URL ?? process.env.VITE_API_URL ?? 'http://127.0.0.1:3001/api')
  .replace(/\/$/, '');
const url = `${urlBase}/estado`;
const timeoutMs = Number(process.env.SALUD_TIMEOUT_MS ?? 10_000);

async function verificar() {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), timeoutMs);

  try {
    const respuesta = await fetch(url, {
      signal: controlador.signal,
      headers: { Accept: 'application/json' },
    });
    const cuerpo = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
      console.error(JSON.stringify({
        ok: false,
        url,
        estado: respuesta.status,
        mensaje: cuerpo?.mensaje ?? 'HTTP error',
      }));
      process.exit(1);
    }

    const operativa = Boolean(cuerpo?.datos?.operativa ?? cuerpo?.exito);
    if (!operativa) {
      console.error(JSON.stringify({ ok: false, url, operativa: false, cuerpo }));
      process.exit(1);
    }

    console.log(JSON.stringify({
      ok: true,
      url,
      operativa: true,
      version: cuerpo?.datos?.version ?? null,
      timestamp: new Date().toISOString(),
    }));
    process.exit(0);
  } catch (err) {
    console.error(JSON.stringify({ ok: false, url, error: err.message }));
    process.exit(1);
  } finally {
    clearTimeout(temporizador);
  }
}

verificar();
