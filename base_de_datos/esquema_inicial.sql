-- Esquema inicial — Plataforma SaaS multi-marca para spas de unas
-- Base de datos: spa_unas
-- Motor: MySQL/MariaDB (XAMPP)

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS spa_unas
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE app_citas;

-- ---------------------------------------------------------------------------
-- Marcas (tenants)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marcas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre_comercial VARCHAR(150) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  color_principal CHAR(7) NOT NULL DEFAULT '#C2185B',
  color_secundario CHAR(7) NOT NULL DEFAULT '#F8BBD0',
  logo_ruta VARCHAR(255) NULL,
  descripcion TEXT NULL,
  telefono VARCHAR(20) NULL,
  whatsapp VARCHAR(20) NULL,
  direccion VARCHAR(255) NULL,
  horarios_json JSON NULL COMMENT 'Horarios de atencion por dia',
  activa TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_marcas_slug (slug),
  KEY idx_marcas_activa (activa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Configuracion visual extendida por marca
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS configuraciones_marca (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  marca_id INT UNSIGNED NOT NULL,
  color_fondo CHAR(7) NOT NULL DEFAULT '#FFFFFF',
  color_texto CHAR(7) NOT NULL DEFAULT '#1A1A1A',
  tipografia VARCHAR(100) NULL DEFAULT 'system-ui',
  configuracion_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_configuraciones_marca (marca_id),
  CONSTRAINT fk_configuraciones_marca FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Usuarios administradores (uno o mas por marca)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  marca_id INT UNSIGNED NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(150) NOT NULL,
  contrasena_hash VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'staff') NOT NULL DEFAULT 'admin',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  ultimo_acceso_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_usuarios_correo (correo),
  KEY idx_usuarios_marca_id (marca_id),
  KEY idx_usuarios_activo (activo),
  CONSTRAINT fk_usuarios_marca FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Clientes (aislados por marca)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  marca_id INT UNSIGNED NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  correo VARCHAR(150) NULL,
  fecha_nacimiento DATE NULL,
  notas TEXT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_clientes_marca_id (marca_id),
  KEY idx_clientes_telefono (marca_id, telefono),
  KEY idx_clientes_nombre (marca_id, nombre),
  CONSTRAINT fk_clientes_marca FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Servicios ofrecidos por marca
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS servicios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  marca_id INT UNSIGNED NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT NULL,
  imagen_ruta VARCHAR(500) NULL,
  duracion_minutos SMALLINT UNSIGNED NOT NULL DEFAULT 60,
  precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  tipo ENUM('marca', 'adicional') NOT NULL DEFAULT 'marca',
  orden_visualizacion SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_servicios_marca_id (marca_id),
  KEY idx_servicios_activo (marca_id, activo),
  KEY idx_servicios_tipo (marca_id, tipo, activo),
  CONSTRAINT fk_servicios_marca FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Citas / reservas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS citas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  marca_id INT UNSIGNED NOT NULL,
  cliente_id INT UNSIGNED NOT NULL,
  servicio_id INT UNSIGNED NOT NULL,
  codigo_confirmacion VARCHAR(32) NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  estado ENUM('pendiente', 'confirmada', 'cancelada', 'completada') NOT NULL DEFAULT 'pendiente',
  cancelada_por ENUM('admin', 'cliente') NULL DEFAULT NULL,
  notas_internas TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_citas_codigo (codigo_confirmacion),
  KEY idx_citas_marca_id (marca_id),
  KEY idx_citas_fecha (marca_id, fecha),
  KEY idx_citas_estado (marca_id, estado),
  KEY idx_citas_horario (marca_id, fecha, hora_inicio, hora_fin),
  CONSTRAINT fk_citas_marca FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE CASCADE,
  CONSTRAINT fk_citas_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_citas_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Blog / publicaciones
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS publicaciones_blog (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  marca_id INT UNSIGNED NOT NULL,
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
  UNIQUE KEY uq_publicaciones_slug_marca (marca_id, slug),
  KEY idx_publicaciones_marca_id (marca_id),
  KEY idx_publicaciones_estado (marca_id, estado),
  CONSTRAINT fk_publicaciones_marca FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Galeria de disenos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS disenos_galeria (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  marca_id INT UNSIGNED NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  imagen_ruta VARCHAR(255) NOT NULL,
  categoria VARCHAR(100) NULL COMMENT 'Tipo: manicura, pedicura, etc.',
  temporada VARCHAR(100) NULL COMMENT 'Estilo tematico: halloween, navidad, etc.',
  colores_relacionados VARCHAR(255) NULL COMMENT 'Colores separados por coma',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  orden_visualizacion SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  en_tendencia TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_disenos_marca_id (marca_id),
  KEY idx_disenos_activo (marca_id, activo),
  KEY idx_disenos_orden (marca_id, orden_visualizacion),
  CONSTRAINT fk_disenos_marca FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catalogo configurable de categorias y temporadas (galeria)
CREATE TABLE IF NOT EXISTS galeria_catalogo (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  marca_id INT UNSIGNED NOT NULL,
  tipo ENUM('categoria', 'temporada') NOT NULL,
  etiqueta VARCHAR(100) NOT NULL,
  valor VARCHAR(100) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  orden_visualizacion SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_galeria_catalogo_marca_tipo_valor (marca_id, tipo, valor),
  KEY idx_galeria_catalogo_lista (marca_id, tipo, activo, orden_visualizacion),
  CONSTRAINT fk_galeria_catalogo_marca FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Notificaciones internas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notificaciones (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  marca_id INT UNSIGNED NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  mensaje TEXT NOT NULL,
  leida TINYINT(1) NOT NULL DEFAULT 0,
  referencia_tipo VARCHAR(50) NULL,
  referencia_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_notificaciones_marca_id (marca_id),
  KEY idx_notificaciones_leida (marca_id, leida),
  CONSTRAINT fk_notificaciones_marca FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tokens de sesion para autenticacion
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tokens_sesion (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  marca_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expira_en DATETIME NOT NULL,
  revocado TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tokens_hash (token_hash),
  KEY idx_tokens_usuario (usuario_id),
  KEY idx_tokens_marca_id (marca_id),
  KEY idx_tokens_expira (expira_en),
  CONSTRAINT fk_tokens_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_tokens_marca FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
