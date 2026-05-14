-- Migration: 040_fix_daily_absences_cron.sql
-- Fix: el cron corría a las 00:01 AM para CURRENT_DATE, marcando como falta
-- el día que recién empezaba. Ahora corre para el día anterior (CURRENT_DATE - 1),
-- asegurando que solo se generen faltas para días completamente pasados.
-- La lógica de hoy (con corte a las 13:00) queda en manos del reconciliador del frontend.

SELECT cron.unschedule('generate-daily-absences-job');

SELECT cron.schedule(
    'generate-daily-absences-job',
    '1 0 * * *',
    $$ SELECT public.generate_daily_absences(CURRENT_DATE - INTERVAL '1 day') $$
);
