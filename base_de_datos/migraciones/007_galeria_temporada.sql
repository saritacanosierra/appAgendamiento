-- Temporada tematica por diseno (Halloween, Navidad, etc.)
ALTER TABLE disenos_galeria
  ADD COLUMN temporada VARCHAR(100) NULL AFTER categoria;
