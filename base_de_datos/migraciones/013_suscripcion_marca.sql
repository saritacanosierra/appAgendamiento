-- Suscripcion SaaS por marca: periodicidad, vigencia y avisos de vencimiento

ALTER TABLE marcas
  ADD COLUMN plan_tipo ENUM('mensual', 'trimestral', 'semestral', 'anual') NULL AFTER plan_habilitado,
  ADD COLUMN plan_inicio_en DATE NULL AFTER plan_tipo,
  ADD COLUMN plan_vence_en DATE NULL AFTER plan_inicio_en,
  ADD COLUMN plan_monto DECIMAL(10,2) NULL AFTER plan_vence_en,
  ADD COLUMN plan_ultima_facturacion_en DATE NULL AFTER plan_monto,
  ADD COLUMN plan_aviso_7_en DATE NULL AFTER plan_ultima_facturacion_en,
  ADD COLUMN plan_aviso_3_en DATE NULL AFTER plan_aviso_7_en,
  ADD COLUMN plan_aviso_1_en DATE NULL AFTER plan_aviso_3_en,
  ADD COLUMN plan_aviso_vencido_en DATE NULL AFTER plan_aviso_1_en;

CREATE INDEX idx_marcas_plan_vence ON marcas (plan_vence_en);

CREATE TABLE IF NOT EXISTS historial_suscripciones_marca (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  marca_id INT UNSIGNED NOT NULL,
  plan_tipo ENUM('mensual', 'trimestral', 'semestral', 'anual') NOT NULL,
  monto DECIMAL(10,2) NULL,
  inicio_en DATE NOT NULL,
  vence_en DATE NOT NULL,
  accion ENUM('activacion', 'renovacion') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_historial_suscripcion_marca (marca_id, created_at),
  CONSTRAINT fk_historial_suscripcion_marca FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
