-- Facturacion y confirmacion de servicios prestados (vista Atencion)
ALTER TABLE citas
  ADD COLUMN precio_base DECIMAL(10, 2) NULL AFTER notas_internas,
  ADD COLUMN precio_adicional DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER precio_base,
  ADD COLUMN precio_final DECIMAL(10, 2) NULL AFTER precio_adicional,
  ADD COLUMN duracion_real_minutos INT UNSIGNED NULL AFTER precio_final,
  ADD COLUMN extras_json JSON NULL AFTER duracion_real_minutos,
  ADD COLUMN confirmada_prestacion TINYINT(1) NOT NULL DEFAULT 0 AFTER extras_json,
  ADD COLUMN cerrada_at TIMESTAMP NULL AFTER confirmada_prestacion;
