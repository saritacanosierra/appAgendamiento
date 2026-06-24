-- Tipo de servicio: reservable (marca) o cargo adicional en Atencion
USE spa_unas;

ALTER TABLE servicios
  ADD COLUMN tipo ENUM('marca', 'adicional') NOT NULL DEFAULT 'marca' AFTER activo;

CREATE INDEX idx_servicios_tipo ON servicios (marca_id, tipo, activo);
