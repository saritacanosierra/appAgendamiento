/**
 * Tests de integracion con MySQL real.
 * Ejecutar solo en local/CI con BD de prueba:
 *   TEST_INTEGRACION=1 npm test
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { crearApp } from '../../src/app.js';

const activo = process.env.TEST_INTEGRACION === '1';
const correoAdmin = process.env.TEST_ADMIN_CORREO ?? 'admin@lunanails.test';
const contrasenaAdmin = process.env.TEST_ADMIN_CONTRASENA ?? 'Admin123!';

describe('Integracion auth + aislamiento admin', { skip: !activo }, () => {
  const app = crearApp();
  let token = null;
  let marcaId = null;

  before(async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ correo: correoAdmin, contrasena: contrasenaAdmin });

    if (login.status !== 200) {
      throw new Error(`Login integracion fallo (${login.status}): ${login.body?.mensaje}`);
    }

    token = login.body.datos.token;
    marcaId = login.body.datos.usuario.marcaId;
  });

  it('login devuelve token y marca de sesion', () => {
    assert.ok(token);
    assert.ok(marcaId);
  });

  it('GET /api/auth/me devuelve la sesion activa', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert.equal(res.body.datos.usuario.marcaId, marcaId);
  });

  it('rechaza admin con marca_id ajeno en query', async () => {
    const otraMarca = marcaId === 1 ? 2 : 1;
    const res = await request(app)
      .get('/api/admin/citas')
      .query({ marca_id: otraMarca })
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    assert.equal(res.body.mensaje, 'Acceso denegado.');
  });

  it('permite listar citas de la propia marca', async () => {
    const res = await request(app)
      .get('/api/admin/citas')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert.equal(res.body.exito, true);
    assert.ok(Array.isArray(res.body.datos));
  });
});
