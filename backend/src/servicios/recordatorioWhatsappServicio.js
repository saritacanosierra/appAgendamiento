import { whatsappServicio } from './whatsappServicio.js';
import { whatsappMarcaServicio } from './whatsappMarcaServicio.js';
import { ReservaRepositorio } from '../repositorios/citasRepositorio.js';
import { minutosHastaInicioCita, normalizarHora } from '../utilidades/horarios.js';

function leerNumeroEnv(nombre, predeterminado) {
  const valor = Number(process.env[nombre]);
  return Number.isFinite(valor) && valor > 0 ? valor : predeterminado;
}

export function configuracionRecordatorioWhatsapp() {
  return {
    habilitado: process.env.WHATSAPP_RECORDATORIO_HABILITADO !== '0',
    horasAntes: leerNumeroEnv('WHATSAPP_RECORDATORIO_HORAS', 4),
    ventanaMinutos: leerNumeroEnv('WHATSAPP_RECORDATORIO_VENTANA_MIN', 10),
    intervaloMinutos: leerNumeroEnv('WHATSAPP_RECORDATORIO_INTERVALO_MIN', 5),
  };
}

function formatearFechaCita(valor) {
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  return String(valor).slice(0, 10);
}

function debeEnviarRecordatorio(fila, horasAntes, ventanaMinutos) {
  const fecha = formatearFechaCita(fila.fecha);
  const horaInicio = normalizarHora(String(fila.hora_inicio).slice(0, 5));
  const minutosRestantes = minutosHastaInicioCita(fecha, horaInicio);
  const objetivo = horasAntes * 60;
  const margen = ventanaMinutos / 2;

  return minutosRestantes <= objetivo + margen && minutosRestantes >= objetivo - margen;
}

export class RecordatorioWhatsappServicio {
  constructor(deps = {}) {
    this.reservaRepo = deps.reservaRepo ?? new ReservaRepositorio();
    this.whatsapp = deps.whatsapp ?? whatsappServicio;
    this.whatsappMarca = deps.whatsappMarca ?? whatsappMarcaServicio;
  }

  async procesarPendientes(opciones = {}) {
    const config = { ...configuracionRecordatorioWhatsapp(), ...opciones };

    if (!config.habilitado) {
      return { omitido: true, motivo: 'recordatorio_deshabilitado' };
    }

    const filas = await this.reservaRepo.listarPendientesRecordatorioWhatsapp();
    const candidatas = filas.filter((fila) =>
      debeEnviarRecordatorio(fila, config.horasAntes, config.ventanaMinutos)
    );

    const resumen = {
      revisadas: filas.length,
      candidatas: candidatas.length,
      enviadas: 0,
      omitidas: 0,
      errores: 0,
    };

    const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/$/, '');

    for (const fila of candidatas) {
      try {
        const fecha = formatearFechaCita(fila.fecha);
        const horaInicio = normalizarHora(String(fila.hora_inicio).slice(0, 5));
        const slug = fila.marca_slug ?? '';
        const urlMiCita = slug ? `${frontendUrl}/m/${slug}/mi-cita` : null;
        const credenciales = await this.whatsappMarca.obtenerCredenciales(fila.marca_id);

        const resultado = await this.whatsapp.enviarRecordatorioCita({
          telefono: fila.cliente_telefono,
          clienteNombre: fila.cliente_nombre,
          marcaNombre: fila.nombre_comercial,
          servicioNombre: fila.servicio_nombre,
          fecha,
          horaInicio,
          codigo: fila.codigo_confirmacion,
          direccion: fila.marca_direccion,
          urlMiCita,
          credenciales,
        });

        if (resultado.enviado || resultado.omitido) {
          await this.reservaRepo.marcarRecordatorioWhatsappEnviado(fila.id);
          if (resultado.enviado) {
            resumen.enviadas += 1;
          } else {
            resumen.omitidas += 1;
          }
        }
      } catch (err) {
        resumen.errores += 1;
        console.error('[whatsapp-recordatorio] Error cita', fila.id, err.message);
      }
    }

    if (resumen.enviadas > 0 || resumen.errores > 0) {
      console.info('[whatsapp-recordatorio]', resumen);
    }

    return resumen;
  }
}

export const recordatorioWhatsappServicio = new RecordatorioWhatsappServicio();
