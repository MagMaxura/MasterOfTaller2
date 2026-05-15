-- Migration: 041_prevent_duplicate_faltas.sql
-- Prevents duplicate FALTA events for the same user on the same date.
-- Other event types (BONO, HORA_EXTRA, etc.) can legitimately have multiple
-- entries per day, so the constraint is partial (WHERE tipo = 'FALTA').
CREATE UNIQUE INDEX IF NOT EXISTS eventos_nomina_falta_unique
ON eventos_nomina (user_id, (fecha_evento::date))
WHERE tipo = 'FALTA';
