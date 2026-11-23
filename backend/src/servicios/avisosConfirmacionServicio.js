import { correoMarcaServicio } from './correoMarcaServicio.js';
import { emailServicio } from './emailServicio.js';
import { whatsappMarcaServicio } from './whatsappMarcaServicio.js';
import { whatsappServicio } from './whatsappServicio.js';
import { motivoAvisoLegible } from '../utilidades/plantillaNotificacion.js';

function normalizarResultado(canal, resultado) {
  if (!resultado) {
    return { canal, estado: 'error', motivo: 'No se pudo enviar el aviso.', motivoCodigo: 'error' };
  }
  if (resultado.enviado) {
    return { canal, estado: 'enviado', motivo: null, motivoCodigo: null };
  }
  if (resultado.error) {
    const codigo = resultado.motivo || 'error';
    return {
      canal,
      estado: 'error',
      motivo: motivoAvisoLegible(codigo),
      motivoCodigo: codigo,
    };
  }
  const codigo = resultado.motivo || 'error';
  return {
    canal,
    estado: 'omitido',
    motivo: motivoAvisoLegible(codigo),
    motivoCodigo: codigo,
  };
}

export class AvisosConfirmacionServicio {
  async enviarTrasReserva({ marcaId, confirmacion, urlConfirmacion }) {
    const canales = await correoMarcaServicio.leerCanales(marcaId);
    const resultados = [];
    const marca = confirmacion?.cita?.marca ?? {};

    if (canales.whatsapp) {
      try {
        const credenciales = await whatsappMarcaServicio.obtenerCredenciales(marcaId);
        if (!credenciales.configurado) {
          resultados.push(normalizarResultado('whatsapp', {
            omitido: true,
            motivo: 'whatsapp_marca_no_configurado',
          }));
        } else {
          const resultado = await whatsappServicio.enviarConfirmacionReserva({
            confirmacion,
            urlConfirmacion,
            credenciales,
          });
          resultados.push(normalizarResultado('whatsapp', resultado));
        }
      } catch (err) {
        resultados.push(normalizarResultado('whatsapp', {
          error: true,
          motivo: err?.message || 'error',
        }));
      }
    }

    if (canales.correo) {
      try {
        const credenciales = await correoMarcaServicio.obtenerCredencialesEnvio(marcaId);
        if (!credenciales.listo) {
          resultados.push(normalizarResultado('correo', {
            omitido: true,
            motivo: 'smtp_no_configurado',
          }));
        } else {
          const resultado = await emailServicio.enviarConfirmacionReservaMarca({
            confirmacion,
            urlConfirmacion,
            smtp: credenciales.smtp,
          });
          resultados.push(normalizarResultado('correo', resultado));
        }
      } catch (err) {
        resultados.push(normalizarResultado('correo', {
          error: true,
          motivo: err?.message || 'error',
        }));
      }
    }

    const fallos = resultados.filter((item) => item.estado === 'error' || item.estado === 'omitido');
    const contactarDirecto = fallos.length > 0 && (
      canales.whatsapp || canales.correo
    );

    if (fallos.length > 0) {
      try {
        const { notificacionServicio } = await import('./notificacionServicio.js');
        const detalle = fallos.map((f) => `${f.canal}: ${f.motivo}`).join(' · ');
        await notificacionServicio.registrar({
          marcaId,
          tipo: 'aviso_confirmacion_fallido',
          titulo: 'No se pudo avisar a la clienta',
          mensaje: `La cita sigue activa. ${detalle}. Indicale comunicarse directamente.`,
          referenciaTipo: 'cita',
          referenciaId: confirmacion?.cita?.id ?? null,
        });
      } catch {
        // La notificacion interna no debe tumbar la reserva.
      }
    }

    return {
      canales,
      resultados,
      contactarDirecto,
      contacto: contactarDirecto
        ? {
          whatsapp: marca.whatsapp ?? null,
          telefono: marca.telefono ?? null,
          nombreComercial: marca.nombreComercial ?? null,
          mensaje: 'Tu cita sigue activa. Comunícate directamente con la marca para confirmar los detalles.',
        }
        : null,
    };
  }
}

export const avisosConfirmacionServicio = new AvisosConfirmacionServicio();
