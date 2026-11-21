-- Premio por puntos: el descuento de la próxima cita y los puntos ya entregados.
CREATE TABLE IF NOT EXISTS premios_puntos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  marca_id INT UNSIGNED NOT NULL,
  cliente_id INT UNSIGNED NOT NULL,
  cita_id INT UNSIGNED NULL,
  puntos_usados INT UNSIGNED NOT NULL,
  porcentaje TINYINT UNSIGNED NOT NULL,
  estado ENUM('pendiente', 'entregado') NOT NULL DEFAULT 'pendiente',
  pendiente_cliente INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  entregado_en TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY uq_premio_pendiente_cliente (pendiente_cliente),
  KEY idx_premios_marca_cliente (marca_id, cliente_id, estado),
  KEY idx_premios_cita (cita_id),
  CONSTRAINT fk_premios_puntos_marca FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE CASCADE,
  CONSTRAINT fk_premios_puntos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  CONSTRAINT fk_premios_puntos_cita FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
