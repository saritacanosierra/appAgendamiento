-- Imagen opcional por servicio (tarjeta publica y admin)
ALTER TABLE servicios
  ADD COLUMN imagen_ruta VARCHAR(500) NULL AFTER descripcion;
