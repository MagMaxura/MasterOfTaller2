-- Migration: Add UNIQUE constraint to periodos_pago to prevent duplicates
-- This also cleans up duplicates before applying the constraint

-- 1. DELETE DUPLICATES (keeping the most recent one by ID/insertion)
DELETE FROM periodos_pago a 
USING periodos_pago b 
WHERE a.id < b.id 
  AND a.user_id = b.user_id 
  AND a.fecha_inicio_periodo = b.fecha_inicio_periodo;

-- 2. ADD UNIQUE CONSTRAINT
ALTER TABLE periodos_pago 
ADD CONSTRAINT unique_payroll_period UNIQUE (user_id, fecha_inicio_periodo);
