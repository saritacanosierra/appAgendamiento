-- Datos de prueba para desarrollo local
-- Ejecutar despues de esquema_inicial.sql

USE spa_unas;

INSERT INTO marcas (
  nombre_comercial, slug, color_principal, color_secundario,
  descripcion, telefono, whatsapp, direccion, horarios_json, activa
) VALUES (
  'Luna Nails Spa',
  'luna-nails',
  '#9C27B0',
  '#E1BEE7',
  'Spa especializado en manicure, pedicure y nail art.',
  '5551234567',
  '5551234567',
  'Av. Reforma 123, Ciudad de Mexico',
  '{"lunes":{"apertura":"10:00","cierre":"19:00"},"martes":{"apertura":"10:00","cierre":"19:00"},"miercoles":{"apertura":"10:00","cierre":"19:00"},"jueves":{"apertura":"10:00","cierre":"19:00"},"viernes":{"apertura":"10:00","cierre":"20:00"},"sabado":{"apertura":"09:00","cierre":"18:00"},"domingo":null}',
  1
);

INSERT INTO configuraciones_marca (marca_id, color_fondo, color_texto)
VALUES (1, '#FFFBFE', '#1C1B1F');

-- Contrasena de prueba: Admin123!
INSERT INTO usuarios (marca_id, nombre, correo, contrasena_hash, rol, activo)
VALUES (
  1,
  'Administradora Luna',
  'admin@lunanails.test',
  '$2b$10$yssRS9WYoqhEaRfWuJdg3OaPDRJZWpzxcADPPE8FkpevGaAMQLlAS',
  'admin',
  1
);

INSERT INTO servicios (marca_id, nombre, descripcion, duracion_minutos, precio, activo, orden_visualizacion)
VALUES
  (1, 'Manicure basico', 'Limpieza, cuticulas y esmaltado.', 45, 250.00, 1, 1),
  (1, 'Pedicure spa', 'Exfoliacion, masaje y esmaltado.', 60, 350.00, 1, 2),
  (1, 'Nail art premium', 'Diseno personalizado con decoracion.', 90, 550.00, 1, 3);

INSERT INTO clientes (marca_id, nombre, telefono, correo, activo)
VALUES (1, 'Maria Ejemplo', '5559876543', 'maria@ejemplo.test', 1);

INSERT INTO publicaciones_blog (
  marca_id, titulo, slug, extracto, contenido, estado, fecha_publicacion
) VALUES (
  1,
  'Como cuidar tus unas en casa',
  'cuidar-unas-en-casa',
  'Consejos basicos para mantener unas sanas entre visitas al spa.',
  '<p>Hidrata tus cuticulas diariamente y evita usar las unas como herramienta.</p>',
  'publicado',
  NOW()
);

INSERT INTO disenos_galeria (
  marca_id, titulo, imagen_ruta, categoria, temporada, colores_relacionados, activo, orden_visualizacion
) VALUES (
  1,
  'French moderno',
  '/subidas/galeria/ejemplo-french.jpg',
  'manicura',
  'clasico',
  'blanco,rosa,nude',
  1,
  1
);
