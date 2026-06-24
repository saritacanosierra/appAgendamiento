-- Favoritos de clientes (servicios y disenos de galeria)
CREATE TABLE IF NOT EXISTS cliente_favoritos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  marca_id INT UNSIGNED NOT NULL,
  cliente_id INT UNSIGNED NOT NULL,
  tipo ENUM('servicio', 'diseno_galeria') NOT NULL,
  referencia_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cliente_favorito (cliente_id, tipo, referencia_id),
  KEY idx_favoritos_marca_cliente (marca_id, cliente_id),
  CONSTRAINT fk_favoritos_marca FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE CASCADE,
  CONSTRAINT fk_favoritos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
