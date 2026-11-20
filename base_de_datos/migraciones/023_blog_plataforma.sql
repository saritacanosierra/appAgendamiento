-- Blogs de quien administra la plataforma. No pertenecen a una marca.
-- Salen en el blog de cada tienda y el propietario no puede borrarlos.

CREATE TABLE IF NOT EXISTS publicaciones_blog_plataforma (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  imagen_destacada VARCHAR(255) NULL,
  extracto TEXT NULL,
  contenido LONGTEXT NOT NULL,
  categoria VARCHAR(100) NULL,
  estado ENUM('borrador', 'publicado') NOT NULL DEFAULT 'borrador',
  fecha_publicacion DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_blog_plataforma_slug (slug),
  KEY idx_blog_plataforma_estado (estado, fecha_publicacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
