-- =====================================================================================
-- !! EJECUTAR ESTO EN EL PROYECTO DE ASISTENCIA (aamxydvzgwadhhrqxkkr) !!
-- =====================================================================================

-- 1. Habilitar la extensión para peticiones HTTP
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Función que dispara el Webhook
CREATE OR REPLACE FUNCTION notify_attendance_event()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  -- URL de la función en tu proyecto principal de Heroes
  webhook_url TEXT := 'https://npoukowwhminfidgkriq.supabase.co/functions/v1/attendance-webhook'; 
  -- Este secret DEBE ser el mismo que configuramos en la función
  webhook_secret TEXT := 'estoesGRANDE333#'; 
BEGIN
  -- Construir el mensaje
  payload := jsonb_build_object(
    'userName', NEW.user_name,
    'type', NEW.type,
    'timestamp', NEW.timestamp,
    'secret', webhook_secret
  );

  -- Realizar la petición POST asíncrona
  PERFORM net.http_post(
    url := webhook_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := payload
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear el Trigger (se activa en cada inserción de log)
DROP TRIGGER IF EXISTS on_access_log_inserted ON access_logs;
CREATE TRIGGER on_access_log_inserted
AFTER INSERT ON access_logs
FOR EACH ROW
EXECUTE FUNCTION notify_attendance_event();

-- VERIFICACIÓN:
-- Una vez ejecutado, cada ficha (IN/OUT) enviará un aviso automático a los administradores.
