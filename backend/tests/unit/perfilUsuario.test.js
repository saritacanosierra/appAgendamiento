import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import { AutenticacionServicio } from '../../src/servicios/index.js';

function crearServicioPerfil({ usuario, correoOcupado = false } = {}) {
  const hash = usuario?.contrasena_hash;
  return new AutenticacionServicio(
    {
      buscarPorId: async (id) => (usuario && usuario.id === id
        ? {
          id: usuario.id,
          marca_id: null,
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: usuario.rol,
          activo: 1,
        }
        : null),
      buscarPorIdConHash: async (id) => (usuario && usuario.id === id ? usuario : null),
      correoEnUsoPorOtro: async () => correoOcupado,
      actualizarPerfil: async (_id, datos) => {
        usuario.nombre = datos.nombre;
        usuario.correo = datos.correo;
      },
      actualizarContrasena: async (_id, nuevoHash) => {
        usuario.contrasena_hash = nuevoHash;
      },
    },
    {
      revocarPorUsuario: async () => {},
      revocarPorUsuarioExcepto: async () => {},
    },
    {},
    {
      hashToken: (t) => `hash:${t}`,
    }
  );
}

describe('AutenticacionServicio.actualizarPerfil', () => {
  it('actualiza nombre y correo sin tocar contrasena', async () => {
    const hash = await bcrypt.hash('secreta123', 4);
    const usuario = {
      id: 1,
      nombre: 'Admin',
      correo: 'viejo@test.com',
      rol: 'superadmin',
      contrasena_hash: hash,
    };
    const servicio = crearServicioPerfil({ usuario });

    const r = await servicio.actualizarPerfil(1, {
      nombre: 'Sara Admin',
      correo: 'nuevo@test.com',
    }, 'token-actual');

    assert.equal(r.usuario.nombre, 'Sara Admin');
    assert.equal(r.usuario.correo, 'nuevo@test.com');
    assert.equal(r.contrasenaActualizada, false);
    assert.equal(usuario.contrasena_hash, hash);
  });

  it('exige contrasena actual correcta para cambiarla', async () => {
    const hash = await bcrypt.hash('secreta123', 4);
    const usuario = {
      id: 1,
      nombre: 'Admin',
      correo: 'admin@test.com',
      rol: 'superadmin',
      contrasena_hash: hash,
    };
    const servicio = crearServicioPerfil({ usuario });

    const mala = await servicio.actualizarPerfil(1, {
      nombre: 'Admin',
      correo: 'admin@test.com',
      contrasena_actual: 'otra',
      contrasena_nueva: 'nuevaclave1',
    }, 'token');

    assert.equal(mala.codigoHttp, 422);
    assert.ok(mala.errores.contrasena_actual);

    const ok = await servicio.actualizarPerfil(1, {
      nombre: 'Admin',
      correo: 'admin@test.com',
      contrasena_actual: 'secreta123',
      contrasena_nueva: 'nuevaclave1',
    }, 'token');

    assert.equal(ok.contrasenaActualizada, true);
    assert.notEqual(usuario.contrasena_hash, hash);
  });

  it('rechaza correo ya usado por otro usuario', async () => {
    const hash = await bcrypt.hash('secreta123', 4);
    const usuario = {
      id: 1,
      nombre: 'Admin',
      correo: 'admin@test.com',
      rol: 'superadmin',
      contrasena_hash: hash,
    };
    const servicio = crearServicioPerfil({ usuario, correoOcupado: true });

    const r = await servicio.actualizarPerfil(1, {
      nombre: 'Admin',
      correo: 'ocupado@test.com',
    });

    assert.equal(r.codigoHttp, 409);
  });
});
