-- Plataforma superadmin + configuracion global (Google OAuth app)
USE spa_unas;

ALTER TABLE marcas
  ADD COLUMN IF NOT EXISTS plan_habilitado TINYINT(1) NOT NULL DEFAULT 1 AFTER activa;

ALTER TABLE usuarios
  MODIFY marca_id INT UNSIGNED NULL,
  MODIFY rol ENUM('superadmin', 'admin', 'staff') NOT NULL DEFAULT 'admin';

ALTER TABLE tokens_sesion
  MODIFY marca_id INT UNSIGNED NULL;

CREATE TABLE IF NOT EXISTS configuracion_plataforma (
  clave VARCHAR(80) NOT NULL PRIMARY KEY,
  valor TEXT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
