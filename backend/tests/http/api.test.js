import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { crearApp } from '../../src/app.js';

const app = crearApp();

describe('HTTP /api/auth/login', () => {
  it('responde 422 si faltan credenciales', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({})
      .expect(422);

    assert.equal(res.body.exito, false);
    assert.ok(res.body.errores.correo);
    assert.ok(res.body.errores.contrasena);
  });

  it('responde 422 si el correo no es valido', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'no-es-email', contrasena: '123456' })
      .expect(422);

    assert.ok(res.body.errores.correo);
  });
});

describe('HTTP /api/reservas', () => {
  it('responde 422 al crear reserva sin datos', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .send({})
      .expect(422);

    assert.equal(res.body.exito, false);
    assert.ok(res.body.errores);
  });
});

describe('HTTP /api/estado', () => {
  it('responde JSON operativo', async () => {
    const res = await request(app).get('/api/estado').expect(200);

    assert.equal(res.body.exito, true);
    assert.ok(res.body.datos.version);
  });
});
