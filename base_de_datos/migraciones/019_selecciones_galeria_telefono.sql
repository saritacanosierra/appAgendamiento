-- Fotos de galeria que una clienta guarda con su celular, antes o sin cita.
CREATE TABLE IF NOT EXISTS selecciones_galeria_telefono (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  marca_id INT UNSIGNED NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  diseno_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_seleccion_telefono_diseno (marca_id, telefono, diseno_id),
  KEY idx_seleccion_telefono (marca_id, telefono),
  CONSTRAINT fk_sel_gal_tel_marca FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE CASCADE,
  CONSTRAINT fk_sel_gal_tel_diseno FOREIGN KEY (diseno_id) REFERENCES disenos_galeria(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO selecciones_galeria_telefono (marca_id, telefono, diseno_id)
SELECT DISTINCT marca_id, telefono, diseno_id
FROM cita_disenos_galeria;
