#!/usr/bin/env node
/**
 * Verifica variables globales de WhatsApp (timing/API version).
 * Las credenciales de envio son **por marca** en Admin → Mi marca.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const vars = [
  'WHATSAPP_API_VERSION',
  'WHATSAPP_RECORDATORIO_HABILITADO',
  'WHATSAPP_RECORDATORIO_HORAS',
  'WHATSAPP_RECORDATORIO_VENTANA_MIN',
  'WHATSAPP_RECORDATORIO_INTERVALO_MIN',
];

console.log('--- Verificacion WhatsApp (global) ---\n');
console.log('Nota: Phone Number ID y token se configuran por marca en Admin → Mi marca.\n');

for (const nombre of vars) {
  const valor = process.env[nombre];
  if (!valor) {
    console.log(`[ ] ${nombre}: no definida (usa valor por defecto en codigo)`);
    continue;
  }
  console.log(`[x] ${nombre}: ${valor}`);
}

console.log('\nEstado: revisa cada marca en Admin → Mi marca → WhatsApp Business');
console.log('Guia: documentacion/whatsapp.md');
