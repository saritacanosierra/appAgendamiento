-- Estilistas por marca, ciudad para SEO y vinculo de galeria/citas.

ALTER TABLE marcas
  ADD COLUMN ciudad VARCHAR(100) NULL AFTER direccion;

CREATE TABLE IF NOT EXISTS estilistas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  marca_id INT UNSIGNED NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  orden_visualizacion SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_estilistas_marca (marca_id, activo),
  CONSTRAINT fk_estilistas_marca FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE disenos_galeria
  ADD COLUMN estilista_id INT UNSIGNED NULL AFTER marca_id;

ALTER TABLE disenos_galeria
  ADD KEY idx_disenos_estilista (marca_id, estilista_id, activo);

ALTER TABLE disenos_galeria
  ADD CONSTRAINT fk_disenos_estilista
  FOREIGN KEY (estilista_id) REFERENCES estilistas(id) ON DELETE SET NULL;

ALTER TABLE citas
  ADD COLUMN estilista_id INT UNSIGNED NULL AFTER servicio_id;

ALTER TABLE citas
  ADD KEY idx_citas_estilista_horario (marca_id, estilista_id, fecha, hora_inicio, hora_fin);

ALTER TABLE citas
  ADD CONSTRAINT fk_citas_estilista
  FOREIGN KEY (estilista_id) REFERENCES estilistas(id) ON DELETE SET NULL;
