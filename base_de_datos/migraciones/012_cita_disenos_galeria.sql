-- Disenos de galeria elegidos por el cliente para una cita reservada
CREATE TABLE IF NOT EXISTS cita_disenos_galeria (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  marca_id INT UNSIGNED NOT NULL,
  cita_id INT UNSIGNED NOT NULL,
  diseno_id INT UNSIGNED NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cita_diseno (cita_id, diseno_id),
  KEY idx_cita_disenos_marca_cita (marca_id, cita_id),
  KEY idx_cita_disenos_telefono (marca_id, telefono),
  CONSTRAINT fk_cita_disenos_marca FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE CASCADE,
  CONSTRAINT fk_cita_disenos_cita FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE CASCADE,
  CONSTRAINT fk_cita_disenos_diseno FOREIGN KEY (diseno_id) REFERENCES disenos_galeria(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
