import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ReservaServicio } from '../../src/servicios/reservaServicio.js';

function servicioSoloValidacion() {
  return new ReservaServicio({
    marcaRepo: {
      buscarPorIdCompleto: async () => {
        throw new Error('No debe consultar BD en validacion');
      },
    },
    estilistaRepo: {
      listarActivos: async () => {
        throw new Error('No debe listar estilistas en validacion');
      },
    },
  });
}

describe('ReservaServicio.crearReservaPublica', () => {
  it('valida campos obligatorios sin consultar la BD', async () => {
    const servicio = servicioSoloValidacion();
    const resultado = await servicio.crearReservaPublica({});

    assert.equal(resultado.codigoHttp, 422);
    assert.ok(resultado.error);
    assert.ok(resultado.errores.marca_id);
    assert.ok(resultado.errores.servicio_id);
    assert.ok(resultado.errores.nombre);
  });

  it('rechaza correo invalido antes de persistir', async () => {
    const servicio = servicioSoloValidacion();
    const resultado = await servicio.crearReservaPublica({
      marca_id: 1,
      servicio_id: 2,
      fecha: '2030-06-15',
      hora_inicio: '10:00',
      nombre: 'Cliente Test',
      telefono: '3001234567',
      correo: 'correo-mal-formado',
    });

    assert.equal(resultado.codigoHttp, 422);
    assert.ok(resultado.errores.correo);
  });

  it('rechaza fechas pasadas antes de persistir', async () => {
    const servicio = servicioSoloValidacion();
    const resultado = await servicio.crearReservaPublica({
      marca_id: 1,
      servicio_id: 2,
      fecha: '2020-01-01',
      hora_inicio: '10:00',
      nombre: 'Cliente Test',
      telefono: '3001234567',
    });

    assert.equal(resultado.codigoHttp, 422);
    assert.match(resultado.error, /pasadas/i);
  });

  it('exige estilista cuando la marca tiene equipo activo', async () => {
    const servicio = new ReservaServicio({
      marcaRepo: {
        buscarPorIdCompleto: async () => ({ id: 1, activa: 1 }),
      },
      estilistaRepo: {
        listarActivos: async () => [{ id: 8, nombre: 'Ana' }],
      },
    });

    const resultado = await servicio.crearReservaPublica({
      marca_id: 1,
      servicio_id: 2,
      fecha: '2030-06-15',
      hora_inicio: '10:00',
      nombre: 'Cliente Test',
      telefono: '3001234567',
    });

    assert.equal(resultado.codigoHttp, 422);
    assert.ok(resultado.errores.estilista_id);
  });

  it('responde 409 si el horario ya no esta en disponibilidad', async () => {
    const servicio = new ReservaServicio({
      marcaRepo: {
        buscarPorIdCompleto: async () => ({
          id: 1,
          activa: 1,
          plan_habilitado: 1,
          horarios_json: {
            sabado: { apertura: '10:00', cierre: '19:00', bloqueos: [] },
          },
        }),
        buscarPorId: async () => ({ id: 1, slug: 'luna' }),
      },
      servicioRepo: {
        buscarActivoPorId: async () => ({
          id: 2,
          nombre: 'Manicure',
          duracion_minutos: 60,
          precio: 50000,
        }),
      },
      estilistaRepo: {
        listarActivos: async () => [],
      },
      calendario: {
        // no usado si obtenerDisponibilidad usa repos internos
      },
    });

    // Forzar disponibilidad vacia de ese slot via spy del metodo
    servicio.obtenerDisponibilidad = async () => ({
      horarios: ['11:00', '12:00'],
    });

    const resultado = await servicio.crearReservaPublica({
      marca_id: 1,
      servicio_id: 2,
      fecha: '2030-06-15',
      hora_inicio: '10:00',
      nombre: 'Cliente Test',
      telefono: '3001234567',
    });

    assert.equal(resultado.codigoHttp, 409);
    assert.match(resultado.error, /ya no esta disponible/i);
  });
});

describe('ReservaServicio.resolverEstilistaReserva', () => {
  it('acepta estilista activa de la marca', async () => {
    const servicio = new ReservaServicio({
      estilistaRepo: {
        listarActivos: async () => [
          { id: 3, nombre: 'Ana' },
          { id: 5, nombre: 'Lu' },
        ],
      },
    });

    const r = await servicio.resolverEstilistaReserva(1, 5);
    assert.equal(r.estilistaId, 5);
    assert.equal(r.estilista.nombre, 'Lu');
  });

  it('rechaza estilista de otra marca / inexistente', async () => {
    const servicio = new ReservaServicio({
      estilistaRepo: {
        listarActivos: async () => [{ id: 3, nombre: 'Ana' }],
      },
    });

    const r = await servicio.resolverEstilistaReserva(1, 99);
    assert.equal(r.codigoHttp, 422);
  });
});
