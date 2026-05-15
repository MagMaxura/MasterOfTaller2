-- Migration: 042_prevent_duplicate_tardiness_early_departure.sql
-- Root cause: reconciler compared fecha_evento (ISO timestamp from DB) with
-- a plain 'YYYY-MM-DD' string — always false, so duplicates were created on
-- every reconciliation run. Fixed in frontend via normDate() helper.
-- These indexes provide an additional DB-level guarantee.
CREATE UNIQUE INDEX IF NOT EXISTS eventos_nomina_tardanza_unique
ON eventos_nomina (user_id, (fecha_evento::date))
WHERE tipo = 'TARDANZA';

CREATE UNIQUE INDEX IF NOT EXISTS eventos_nomina_salida_temprana_unique
ON eventos_nomina (user_id, (fecha_evento::date))
WHERE tipo = 'SALIDA_TEMPRANA';
