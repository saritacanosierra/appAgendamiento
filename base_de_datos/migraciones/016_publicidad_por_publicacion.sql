-- Cada campana es una imagen con enlace o un enlace, y se asigna a publicaciones.

ALTER TABLE publicidad_blog
  ADD COLUMN tipo ENUM('imagen', 'enlace') NOT NULL DEFAULT 'enlace' AFTER titulo;

CREATE TABLE IF NOT EXISTS publicidad_blog_publicacion (
  publicidad_id INT UNSIGNED NOT NULL,
  publicacion_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (publicidad_id, publicacion_id),
  KEY idx_publicidad_publicacion (publicacion_id),
  CONSTRAINT fk_publicidad_campana FOREIGN KEY (publicidad_id) REFERENCES publicidad_blog(id) ON DELETE CASCADE,
  CONSTRAINT fk_publicidad_publicacion FOREIGN KEY (publicacion_id) REFERENCES publicaciones_blog(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
