
-- 1. Mejorar generate_daily_absences para ignorar fines de semana
CREATE OR REPLACE FUNCTION generate_daily_absences(p_date DATE)
RETURNS void AS $$
BEGIN
    -- Ignorar si es Sábado (6) o Domingo (0)
    IF EXTRACT(DOW FROM p_date) IN (0, 6) THEN
        RETURN;
    END IF;

    INSERT INTO eventos_nomina (user_id, tipo, monto, descripcion, fecha_evento)
    SELECT 
        p.id, 
        'FALTA', 
        0, 
        'FALTA INJUSTIFICADA (Auto-generada)', 
        to_char(p_date, 'YYYY-MM-DD')
    FROM profiles p
    WHERE p.role = 'tecnico' 
      AND p.is_active = true
      -- No tiene ya una falta para ese día
      AND NOT EXISTS (
          SELECT 1 FROM eventos_nomina en 
          WHERE en.user_id = p.id 
          AND en.fecha_evento = to_char(p_date, 'YYYY-MM-DD') 
          AND en.tipo = 'FALTA'
      )
      -- No está de vacaciones aprobadas
      AND NOT EXISTS (
          SELECT 1 FROM vacation_requests vr 
          WHERE vr.user_id = p.id 
          AND vr.status = 'APROBADA'
          AND p_date >= vr.start_date::date 
          AND p_date <= vr.end_date::date
      );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
