-- !! EJECUTAR ESTO EN EL PROYECTO DE ASISTENCIA (EL QUE TIENE LA TABLA access_logs) !!

-- 1. Habilitar la extensión para peticiones HTTP
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Función que dispara el Webhook
CREATE OR REPLACE FUNCTION notify_attendance_event()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  webhook_url TEXT := 'https://npoukowwhminfidgkriq.supabase.co/functions/v1/attendance-webhook'; -- AJUSTA ESTO CON TU URL DE PROYECTO PRINCIPAL
  webhook_secret TEXT := 'TU_CLAVE_SECRETA_COMPARTIDA'; -- AJUSTA ESTO (DEBE COINCIDIR CON EL SECRET EN EL PROYECTO PRINCIPAL)
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

-- 3. Crear el Trigger
DROP TRIGGER IF EXISTS on_access_log_inserted ON access_logs;
CREATE TRIGGER on_access_log_inserted
AFTER INSERT ON access_logs
FOR EACH ROW
EXECUTE FUNCTION notify_attendance_event();
