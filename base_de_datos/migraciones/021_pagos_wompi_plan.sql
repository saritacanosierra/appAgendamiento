-- El periodo elegido (mes, trimestre, semestre o año) queda en el intento de pago.
ALTER TABLE pagos_wompi
  ADD COLUMN plan_tipo ENUM('mensual', 'trimestral', 'semestral', 'anual') NOT NULL DEFAULT 'mensual'
  AFTER monto_centavos;
