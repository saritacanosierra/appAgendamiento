import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { almacenamientoS3Habilitado } from '../../src/servicios/almacenamientoArchivosServicio.js';

describe('almacenamientoArchivosServicio', () => {
  it('usa almacenamiento local por defecto en tests', () => {
    assert.equal(almacenamientoS3Habilitado(), false);
  });
});
