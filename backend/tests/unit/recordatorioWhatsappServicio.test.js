import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RecordatorioWhatsappServicio } from '../../src/servicios/recordatorioWhatsappServicio.js';

function filaCandidata(opciones = {}) {
  const inicio = new Date(Date.now() + 4 * 60 * 60 * 1000);
  const fecha = inicio.toISOString().slice(0, 10);
  const hora = `${String(inicio.getHours()).padStart(2, '0')}:${String(inicio.getMinutes()).padStart(2, '0')}`;

  return {
    id: opciones.id ?? 99,
    marca_id: 1,
    marca_slug: 'luna-nails',
    nombre_comercial: 'Luna Nails',
    marca_direccion: 'Calle 1',
    cliente_nombre: 'Cliente Test',
    cliente_telefono: '5512345678',
    servicio_nombre: 'Manicure',
    codigo_confirmacion: 'ABC123',
    fecha,
    hora_inicio: `${hora}:00`,
    ...opciones,
  };
}

describe('RecordatorioWhatsappServicio', () => {
  it('omite procesamiento si esta deshabilitado', async () => {
    const servicio = new RecordatorioWhatsappServicio({
      reservaRepo: {
        listarPendientesRecordatorioWhatsapp: async () => {
          throw new Error('No debe consultar BD');
        },
      },
    });

    const resultado = await servicio.procesarPendientes({ habilitado: false });
    assert.equal(resultado.omitido, true);
    assert.equal(resultado.motivo, 'recordatorio_deshabilitado');
  });

  it('procesa candidatas en ventana y marca como enviadas', async () => {
    const fila = filaCandidata();
    let marcada = false;

    const servicio = new RecordatorioWhatsappServicio({
      reservaRepo: {
        listarPendientesRecordatorioWhatsapp: async () => [fila],
        marcarRecordatorioWhatsappEnviado: async (id) => {
          assert.equal(id, fila.id);
          marcada = true;
        },
      },
      whatsappMarca: {
        obtenerCredenciales: async () => ({
          marcaId: 1,
          configurado: false,
        }),
      },
      whatsapp: {
        enviarRecordatorioCita: async () => ({ omitido: true, motivo: 'whatsapp_marca_no_configurado' }),
      },
    });

    const resultado = await servicio.procesarPendientes({
      habilitado: true,
      horasAntes: 4,
      ventanaMinutos: 30,
    });

    assert.equal(resultado.revisadas, 1);
    assert.equal(resultado.candidatas, 1);
    assert.equal(resultado.omitidas, 1);
    assert.equal(resultado.enviadas, 0);
    assert.equal(marcada, true);
  });

  it('ignora citas fuera de la ventana de recordatorio', async () => {
    const filaLejana = filaCandidata({
      fecha: '2099-12-31',
      hora_inicio: '10:00:00',
    });

    const servicio = new RecordatorioWhatsappServicio({
      reservaRepo: {
        listarPendientesRecordatorioWhatsapp: async () => [filaLejana],
        marcarRecordatorioWhatsappEnviado: async () => {
          throw new Error('No debe marcar citas fuera de ventana');
        },
      },
      whatsappMarca: {
        obtenerCredenciales: async () => ({ marcaId: 1, configurado: false }),
      },
      whatsapp: {
        enviarRecordatorioCita: async () => ({ enviado: true }),
      },
    });

    const resultado = await servicio.procesarPendientes({
      habilitado: true,
      horasAntes: 4,
      ventanaMinutos: 10,
    });

    assert.equal(resultado.revisadas, 1);
    assert.equal(resultado.candidatas, 0);
    assert.equal(resultado.enviadas, 0);
  });
});
