/**
 * Crea (o actualiza) una cita de prueba en la ventana del recordatorio
 * y ejecuta el envio de WhatsApp inmediatamente.
 *
 * Uso:
 *   npm run probar:whatsapp-recordatorio
 *   npm run probar:whatsapp-recordatorio -- --horas=1
 *   npm run probar:whatsapp-recordatorio -- --telefono=5512345678 --slug=luna-nails
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/configuracion/baseDatos.js';
import {
  ClienteRepositorio,
  ReservaRepositorio,
  ServicioRepositorio,
  MarcaRepositorio,
  generarCodigoConfirmacion,
} from '../src/repositorios/index.js';
import { sumarMinutosAHora, normalizarHora } from '../src/utilidades/horarios.js';
import { recordatorioWhatsappServicio } from '../src/servicios/recordatorioWhatsappServicio.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MARCADOR_PRUEBA = '[prueba-recordatorio-whatsapp]';

function leerArg(nombre, predeterminado) {
  const prefijo = `--${nombre}=`;
  const arg = process.argv.find((a) => a.startsWith(prefijo));
  if (!arg) return predeterminado;
  const valor = arg.slice(prefijo.length).trim();
  return valor || predeterminado;
}

function calcularFechaHoraCita(horasDesdeAhora) {
  const inicio = new Date(Date.now() + horasDesdeAhora * 60 * 60 * 1000);
  const fecha = [
    inicio.getFullYear(),
    String(inicio.getMonth() + 1).padStart(2, '0'),
    String(inicio.getDate()).padStart(2, '0'),
  ].join('-');
  const horaInicio = normalizarHora(
    `${inicio.getHours()}:${String(inicio.getMinutes()).padStart(2, '0')}`
  );
  return { fecha, horaInicio, inicio };
}

async function buscarMarca(marcaRepo, slug) {
  if (slug) {
    const marca = await marcaRepo.buscarPorSlug(slug);
    if (!marca) throw new Error(`Marca no encontrada con slug "${slug}".`);
    return marca;
  }

  const [filas] = await pool.execute(
    `SELECT id, nombre_comercial, slug FROM marcas WHERE activa = 1 ORDER BY id ASC LIMIT 1`
  );
  if (!filas[0]) throw new Error('No hay marcas activas en la base de datos.');
  return filas[0];
}

async function buscarCitaPrueba(marcaId) {
  const [filas] = await pool.execute(
    `SELECT id, codigo_confirmacion FROM citas
     WHERE marca_id = ? AND notas_internas = ?
     ORDER BY id DESC LIMIT 1`,
    [marcaId, MARCADOR_PRUEBA]
  );
  return filas[0] ?? null;
}

async function main() {
  const horasAntes = Number(leerArg('horas', process.env.WHATSAPP_RECORDATORIO_HORAS ?? '4'));
  const telefono = leerArg('telefono', '5550001234').replace(/\D+/g, '');
  const slug = leerArg('slug', '');

  if (!Number.isFinite(horasAntes) || horasAntes <= 0) {
    throw new Error('El parametro --horas debe ser un numero mayor a 0.');
  }

  const marcaRepo = new MarcaRepositorio();
  const servicioRepo = new ServicioRepositorio();
  const clienteRepo = new ClienteRepositorio();
  const reservaRepo = new ReservaRepositorio();

  const marca = await buscarMarca(marcaRepo, slug);
  const servicios = await servicioRepo.listarActivosPorMarca(marca.id);
  if (!servicios.length) {
    throw new Error(`La marca "${marca.nombre_comercial}" no tiene servicios activos.`);
  }
  const servicio = servicios[0];

  const { fecha, horaInicio } = calcularFechaHoraCita(horasAntes);
  const horaFin = sumarMinutosAHora(horaInicio, servicio.duracion_minutos);

  let cliente = await clienteRepo.buscarPorTelefono(marca.id, telefono);
  if (!cliente) {
    const clienteId = await clienteRepo.crear(pool, {
      marcaId: marca.id,
      nombre: 'Cliente Prueba WhatsApp',
      telefono,
      correo: 'prueba.whatsapp@test.local',
      notas: MARCADOR_PRUEBA,
    });
    cliente = await clienteRepo.buscarPorId(marca.id, clienteId);
  }

  const citaPrueba = await buscarCitaPrueba(marca.id);
  let codigo;

  if (citaPrueba) {
    codigo = citaPrueba.codigo_confirmacion;
    await pool.execute(
      `UPDATE citas
       SET cliente_id = ?, servicio_id = ?, fecha = ?, hora_inicio = ?, hora_fin = ?,
           estado = 'confirmada', whatsapp_recordatorio_enviado_at = NULL, notas_internas = ?
       WHERE id = ? AND marca_id = ?`,
      [
        cliente.id,
        servicio.id,
        fecha,
        horaInicio,
        horaFin,
        MARCADOR_PRUEBA,
        citaPrueba.id,
        marca.id,
      ]
    );
    console.log(`Cita de prueba actualizada (#${citaPrueba.id}, codigo ${codigo}).`);
  } else {
    codigo = generarCodigoConfirmacion();
    const citaId = await reservaRepo.crear(pool, {
      marcaId: marca.id,
      clienteId: cliente.id,
      servicioId: servicio.id,
      codigoConfirmacion: codigo,
      fecha,
      horaInicio,
      horaFin,
      estado: 'confirmada',
      notasInternas: MARCADOR_PRUEBA,
    });
    console.log(`Cita de prueba creada (#${citaId}, codigo ${codigo}).`);
  }

  console.log('');
  console.log('--- Datos de la prueba ---');
  console.log(`Marca:     ${marca.nombre_comercial} (${marca.slug})`);
  console.log(`Servicio:  ${servicio.nombre}`);
  console.log(`Cliente:   ${cliente.nombre} — tel ${telefono}`);
  console.log(`Cita:      ${fecha} ${horaInicio} (en ~${horasAntes} h)`);
  console.log(`Objetivo:  recordatorio ${horasAntes} h antes del servicio`);
  console.log(`WhatsApp:  ${process.env.WHATSAPP_HABILITADO === '1' ? 'envio real (global legacy)' : 'por marca en Admin → Mi marca'}`);

  const { whatsappMarcaServicio } = await import('../src/servicios/whatsappMarcaServicio.js');
  const credenciales = await whatsappMarcaServicio.obtenerCredenciales(marca.id);
  console.log('');
  console.log('--- WhatsApp de esta marca ---');
  console.log(`Numero publico (remitente visible): ${credenciales.numeroPublico ?? '(sin configurar)'}`);
  console.log(`Phone Number ID:               ${credenciales.phoneNumberId ?? '(sin configurar)'}`);
  console.log(`API configurada:               ${credenciales.configurado ? 'si' : 'no'}`);
  if (!credenciales.configurado) {
    console.log('Configuralo en Admin → Mi marca → WhatsApp Business antes de probar envios reales.');
  }
  console.log('');

  const resumen = await recordatorioWhatsappServicio.procesarPendientes({
    horasAntes,
    ventanaMinutos: 30,
  });

  console.log('Resultado:', resumen);
  console.log('');

  if (resumen.candidatas === 0) {
    console.log('No entro en ventana. Prueba con otra hora:');
    console.log(`  npm run probar:whatsapp-recordatorio -- --horas=${horasAntes}`);
  } else if (resumen.enviadas > 0) {
    console.log('Mensaje enviado por WhatsApp API.');
  } else if (resumen.omitidas > 0) {
    console.log('Mensaje simulado. Revisa la consola del backend o ejecuta de nuevo aqui.');
    console.log('Busca una linea como: [whatsapp] API no configurada — mensaje simulado');
  } else if (resumen.errores > 0) {
    console.log('Hubo error al enviar. Revisa el log del backend.');
  }

  console.log('');
  console.log('Para repetir la prueba con la misma cita, vuelve a ejecutar este script.');
  console.log('Consulta en BD: SELECT * FROM citas WHERE notas_internas = ?;', MARCADOR_PRUEBA);

  await pool.end();
}

main().catch(async (err) => {
  console.error('Error:', err.message);
  try {
    await pool.end();
  } catch {
    // ignore
  }
  process.exit(1);
});
