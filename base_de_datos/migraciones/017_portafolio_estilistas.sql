-- Foto y habilidades destacadas de cada profesional.

ALTER TABLE estilistas
  ADD COLUMN foto_ruta VARCHAR(255) NULL AFTER nombre,
  ADD COLUMN habilidades VARCHAR(280) NULL AFTER foto_ruta;
