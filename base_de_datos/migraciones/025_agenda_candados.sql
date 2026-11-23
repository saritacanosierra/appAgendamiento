-- Candados por marca/día/estilista para serializar reservas concurrentes.
CREATE TABLE IF NOT EXISTS agenda_candados (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  marca_id INT UNSIGNED NOT NULL,
  fecha DATE NOT NULL,
  estilista_clave INT NOT NULL DEFAULT 0 COMMENT '0 = sin estilista',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_agenda_candado (marca_id, fecha, estilista_clave),
  KEY idx_agenda_candados_marca_fecha (marca_id, fecha),
  CONSTRAINT fk_agenda_candados_marca FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
