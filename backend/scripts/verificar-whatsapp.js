#!/usr/bin/env node
/**
 * Verifica variables de WhatsApp Business Cloud API sin mostrar secretos.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const vars = [
  'WHATSAPP_HABILITADO',
  'WHATSAPP_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_CODIGO_PAIS',
  'WHATSAPP_API_VERSION',
];

console.log('--- Verificacion WhatsApp Business API ---\n');

for (const nombre of vars) {
  const valor = process.env[nombre];
  if (!valor) {
    console.log(`[ ] ${nombre}: no definida`);
    continue;
  }
  if (nombre.includes('TOKEN')) {
    console.log(`[x] ${nombre}: definida (${valor.length} caracteres)`);
  } else {
    console.log(`[x] ${nombre}: ${valor}`);
  }
}

const listo = Boolean(
  process.env.WHATSAPP_HABILITADO === '1'
  && process.env.WHATSAPP_TOKEN
  && process.env.WHATSAPP_PHONE_NUMBER_ID
);

console.log('\nEstado:', listo ? 'LISTO para enviar mensajes' : 'INCOMPLETO — revisa .env');
console.log('Guia: documentacion/whatsapp.md');
