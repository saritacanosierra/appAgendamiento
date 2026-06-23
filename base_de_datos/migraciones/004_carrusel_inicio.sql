-- Diapositivas del carrusel del inicio (app clientes)
CREATE TABLE IF NOT EXISTS carrusel_inicio (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  marca_id INT UNSIGNED NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  subtitulo VARCHAR(300) NULL,
  imagen_ruta VARCHAR(500) NOT NULL,
  enlace_url VARCHAR(500) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  orden_visualizacion INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_carrusel_marca (marca_id, activo, orden_visualizacion),
  CONSTRAINT fk_carrusel_marca FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
