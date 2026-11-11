-- Descripcion corta del portafolio de cada profesional.

ALTER TABLE estilistas
  ADD COLUMN descripcion VARCHAR(280) NULL AFTER habilidades;
