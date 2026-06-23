-- Solicitudes de reagendamiento (cliente sugiere fecha/hora; admin aprueba)
USE spa_unas;

CREATE TABLE IF NOT EXISTS solicitudes_reagendamiento (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  marca_id INT UNSIGNED NOT NULL,
  cita_id INT UNSIGNED NOT NULL,
  fecha_actual DATE NOT NULL,
  hora_actual TIME NOT NULL,
  fecha_solicitada DATE NOT NULL,
  hora_inicio_solicitada TIME NOT NULL,
  hora_fin_solicitada TIME NOT NULL,
  motivo TEXT NULL,
  estado ENUM('pendiente', 'aprobada', 'rechazada') NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_solicitudes_marca_estado (marca_id, estado),
  KEY idx_solicitudes_cita (cita_id),
  CONSTRAINT fk_solicitudes_marca FOREIGN KEY (marca_id) REFERENCES marcas (id) ON DELETE CASCADE,
  CONSTRAINT fk_solicitudes_cita FOREIGN KEY (cita_id) REFERENCES citas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
