import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { almacenamientoImagenes } from '../../src/configuracion/entorno.js';
import { almacenamientoS3Habilitado } from '../../src/servicios/almacenamientoArchivosServicio.js';

describe('almacenamientoArchivosServicio', () => {
  it('reporta S3 solo si el modo y las credenciales estan completas', () => {
    const esperado = almacenamientoImagenes.modo === 's3'
      && Boolean(almacenamientoImagenes.bucket)
      && Boolean(almacenamientoImagenes.accessKeyId)
      && Boolean(almacenamientoImagenes.secretAccessKey)
      && Boolean(almacenamientoImagenes.publicUrlBase);
    assert.equal(almacenamientoS3Habilitado(), esperado);
  });
});
