import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AutenticacionServicio } from '../../src/servicios/index.js';

const marcaOperativa = {
  id: 5,
  activa: 1,
  plan_habilitado: 1,
  plan_vence_en: null,
  slug: 'luna-nails',
  nombre_comercial: 'Luna Nails',
};

function crearServicioAuth({ usuario = null, marca = marcaOperativa } = {}) {
  const usuarioRepo = {
    buscarPorCorreo: async () => usuario,
    buscarPorId: async () => usuario,
    actualizarUltimoAcceso: async () => {},
  };
  const tokenRepo = {
    crear: async () => {},
    buscarValido: async () => null,
    revocar: async () => {},
  };
  const marcaRepo = {
    buscarPorIdCompleto: async () => marca,
    buscarPorId: async () => marca,
  };

  const servicio = new AutenticacionServicio(usuarioRepo, tokenRepo, marcaRepo);
  servicio.verificarCredenciales = async (correo) => {
    if (!usuario || correo !== usuario.correo) return null;
    return usuario;
  };

  return servicio;
}

describe('AutenticacionServicio.iniciarSesion', () => {
  it('rechaza credenciales invalidas', async () => {
    const servicio = crearServicioAuth({ usuario: null });
    const resultado = await servicio.iniciarSesion('no@existe.com', 'x');

    assert.equal(resultado.error, 'Credenciales invalidas.');
    assert.equal(resultado.token, undefined);
  });

  it('inicia sesion de admin de marca y devuelve token', async () => {
    const usuario = {
      id: 10,
      marca_id: 5,
      nombre: 'Admin Demo',
      correo: 'admin@lunanails.test',
      rol: 'admin',
    };
    const servicio = crearServicioAuth({ usuario });
    const resultado = await servicio.iniciarSesion(usuario.correo, 'Admin123!');

    assert.ok(resultado.token);
    assert.ok(resultado.expiraEn);
    assert.equal(resultado.usuario.marcaId, 5);
    assert.equal(resultado.marca.slug, 'luna-nails');
  });

  it('rechaza marca con plan inactivo', async () => {
    const usuario = {
      id: 10,
      marca_id: 5,
      nombre: 'Admin',
      correo: 'admin@test.com',
      rol: 'admin',
    };
    const marcaVencida = {
      ...marcaOperativa,
      plan_habilitado: 0,
    };
    const servicio = crearServicioAuth({ usuario, marca: marcaVencida });
    const resultado = await servicio.iniciarSesion(usuario.correo, 'pass');

    assert.ok(resultado.error);
    assert.equal(resultado.codigoHttp, 403);
  });
});
