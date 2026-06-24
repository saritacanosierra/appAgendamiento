-- Marca de envio del recordatorio WhatsApp (4 h antes del servicio)
ALTER TABLE citas
  ADD COLUMN whatsapp_recordatorio_enviado_at TIMESTAMP NULL DEFAULT NULL
  AFTER updated_at;
