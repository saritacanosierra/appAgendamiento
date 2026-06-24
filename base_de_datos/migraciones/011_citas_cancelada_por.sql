-- Quien cancelo la cita: admin del panel o cliente desde la web
ALTER TABLE citas
  ADD COLUMN cancelada_por ENUM('admin', 'cliente') NULL DEFAULT NULL
  AFTER estado;
