-- Migration: Fix negative amounts for deduction events
-- Deductions should be stored as positive numbers, as the calculation logic subtracts them.

UPDATE eventos_nomina
SET monto = ABS(monto)
WHERE tipo IN ('FALTA', 'TARDANZA', 'APERCIBIMIENTO', 'PRESTAMO', 'SALIDA_TEMPRANA')
  AND monto < 0;
