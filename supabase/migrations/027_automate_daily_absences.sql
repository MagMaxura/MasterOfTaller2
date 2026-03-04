-- Habilitar la extensión de cron si no está habilitada
-- Nota: En Supabase, pg_cron se habilita a nivel de base de datos desde el dashboard, 
-- pero intentar crearlo por SQL es una buena práctica.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Eliminar la tarea si ya existe para evitar duplicados de forma segura
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-daily-absences-job') THEN
        PERFORM cron.unschedule('generate-daily-absences-job');
    END IF;
END $$;

-- Programar la tarea: Ejecutar a las 00:01 AM todos los días
-- La expresión cron '1 0 * * *' significa: minuto 1, hora 0, cualquier día del mes, cualquier mes, cualquier día de la semana.
SELECT cron.schedule(
    'generate-daily-absences-job',
    '1 0 * * *',
    $$ SELECT public.generate_daily_absences(CURRENT_DATE) $$
);
