/**
 * Ejecuta manualmente el envio de recordatorios WhatsApp pendientes.
 * Uso: node scripts/enviar-recordatorios-whatsapp.js
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { recordatorioWhatsappServicio } from '../src/servicios/recordatorioWhatsappServicio.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const resumen = await recordatorioWhatsappServicio.procesarPendientes();
console.log('Resultado:', resumen);
