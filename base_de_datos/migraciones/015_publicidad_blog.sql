-- Publicidad pagada del blog. Es de la plataforma, no de una marca.

CREATE TABLE IF NOT EXISTS publicidad_blog (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  anunciante VARCHAR(150) NOT NULL,
  titulo VARCHAR(180) NOT NULL,
  texto VARCHAR(280) NULL,
  imagen_ruta VARCHAR(255) NULL,
  enlace_url VARCHAR(500) NULL,
  activa TINYINT(1) NOT NULL DEFAULT 1,
  orden_visualizacion SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_publicidad_activa (activa, orden_visualizacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
