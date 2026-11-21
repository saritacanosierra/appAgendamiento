import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CopiaMarcaServicio } from '../../src/servicios/copiaMarcaServicio.js';

const directorio = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../almacen/copias'
);
const creados = [];

function archivoDePrueba(marcaId) {
  const nombre = `copia-${marcaId}-${Date.now()}${Math.floor(Math.random() * 1000)}.json`;
  creados.push(path.join(directorio, nombre));
  return nombre;
}

describe('copiaMarcaServicio.eliminar', () => {
  after(async () => {
    await Promise.all(creados.map((ruta) => fs.unlink(ruta).catch(() => {})));
  });

  it('rechaza un nombre que no es una copia', async () => {
    const servicio = new CopiaMarcaServicio({ idsExistentes: async () => new Set() });
    const resultado = await servicio.eliminar('../secreto.json');
    assert.equal(resultado.codigoHttp, 404);
  });

  it('no borra la copia si la empresa sigue en la plataforma', async () => {
    const nombre = archivoDePrueba(900001);
    const ruta = path.join(directorio, nombre);
    await fs.mkdir(directorio, { recursive: true });
    await fs.writeFile(ruta, '{}', 'utf8');
    const servicio = new CopiaMarcaServicio({
      idsExistentes: async () => new Set([900001]),
    });

    const resultado = await servicio.eliminar(nombre);

    assert.equal(resultado.codigoHttp, 409);
    await fs.access(ruta);
  });

  it('borra la copia cuando la empresa ya no existe', async () => {
    const nombre = archivoDePrueba(900002);
    const ruta = path.join(directorio, nombre);
    await fs.mkdir(directorio, { recursive: true });
    await fs.writeFile(ruta, '{}', 'utf8');
    const servicio = new CopiaMarcaServicio({
      idsExistentes: async () => new Set(),
    });

    const resultado = await servicio.eliminar(nombre);

    assert.equal(resultado.eliminada, true);
    await assert.rejects(() => fs.access(ruta));
  });
});
