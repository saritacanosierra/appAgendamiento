-- Catalogo configurable de categorias y temporadas por marca (galeria)
CREATE TABLE IF NOT EXISTS galeria_catalogo (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  marca_id INT UNSIGNED NOT NULL,
  tipo ENUM('categoria', 'temporada') NOT NULL,
  etiqueta VARCHAR(100) NOT NULL,
  valor VARCHAR(100) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  orden_visualizacion SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_galeria_catalogo_marca_tipo_valor (marca_id, tipo, valor),
  KEY idx_galeria_catalogo_lista (marca_id, tipo, activo, orden_visualizacion),
  CONSTRAINT fk_galeria_catalogo_marca FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
