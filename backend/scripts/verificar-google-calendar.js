/**
 * Verifica que las variables de Google Calendar esten definidas.
 * No imprime secretos — solo indica si faltan valores.
 *
 * Uso: npm run verificar:google
 */
import 'dotenv/config';

const vars = [
  { clave: 'GOOGLE_CLIENT_ID', valor: process.env.GOOGLE_CLIENT_ID },
  { clave: 'GOOGLE_CLIENT_SECRET', valor: process.env.GOOGLE_CLIENT_SECRET },
  { clave: 'GOOGLE_REDIRECT_URI', valor: process.env.GOOGLE_REDIRECT_URI },
  { clave: 'FRONTEND_URL', valor: process.env.FRONTEND_URL },
];

console.log('Verificacion Google Calendar OAuth\n');

let ok = true;
for (const { clave, valor } of vars) {
  const definida = Boolean(valor && String(valor).trim());
  console.log(`  ${clave}: ${definida ? 'OK' : 'FALTA'}`);
  if (!definida) ok = false;
}

console.log('');
if (ok) {
  console.log('Listo. Reinicia el backend y conecta desde Admin → Configuracion.');
  console.log('Guia: documentacion/google_calendar.md');
} else {
  console.log('Completa las variables en backend/.env y vuelve a ejecutar.');
  console.log('Guia: documentacion/google_calendar.md');
  process.exit(1);
}
