
-- Migration to add missing enum values to tipo_evento_nomina
-- Note: These must be run outside of a transaction block in some versions of Postgres, 
-- but Supabase usually handles them fine if run sequentially.

ALTER TYPE tipo_evento_nomina ADD VALUE IF NOT EXISTS 'SALIDA_TEMPRANA';
ALTER TYPE tipo_evento_nomina ADD VALUE IF NOT EXISTS 'VACACIONES';
ALTER TYPE tipo_evento_nomina ADD VALUE IF NOT EXISTS 'ENFERMEDAD';
ALTER TYPE tipo_evento_nomina ADD VALUE IF NOT EXISTS 'PERMISO';
ALTER TYPE tipo_evento_nomina ADD VALUE IF NOT EXISTS 'PRESTAMO';
