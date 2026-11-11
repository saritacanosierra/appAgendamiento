-- Intentos de pago mensual con Wompi, uno por referencia
CREATE TABLE IF NOT EXISTS pagos_wompi (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  marca_id INT UNSIGNED NOT NULL,
  referencia VARCHAR(80) NOT NULL,
  monto_centavos INT UNSIGNED NOT NULL,
  estado ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',
  transaccion_id VARCHAR(80) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pago_referencia (referencia),
  KEY idx_pago_marca (marca_id, created_at),
  CONSTRAINT fk_pago_wompi_marca FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
