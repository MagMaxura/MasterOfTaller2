-- Migration: 032_add_holidays_table.sql
-- Description: Adds a table for holidays to manage non-working days.

CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view holidays" 
    ON holidays FOR SELECT 
    USING (true);

CREATE POLICY "Admins can manage holidays" 
    ON holidays FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = 'administrador' OR profiles.role = 'admin' OR profiles.role = 'administrativo')
        )
    );

-- Populate with some common holidays if needed (OPTIONAL)
-- INSERT INTO holidays (date, description) VALUES ('2026-01-01', 'Año Nuevo');
-- INSERT INTO holidays (date, description) VALUES ('2026-05-01', 'Día del Trabajador');

-- -----------------------------------------------------------------------------
-- UPDATE generate_daily_absences function to respect holidays
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_daily_absences(p_date DATE)
RETURNS void AS $$
BEGIN
    -- Ignorar si es Sábado (6) o Domingo (0)
    IF EXTRACT(DOW FROM p_date) IN (0, 6) THEN
        RETURN;
    END IF;

    -- Ignorar si es FERIADO
    IF EXISTS (SELECT 1 FROM holidays WHERE date = p_date) THEN
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
      )
      -- No ha tenido ingresos registrados PARA ESTE DÍA ESPECÍFICO
      -- Nota: Si la cámara está en otra base, esto se reconcilia después vía app. 
      -- Pero de base evitamos duplicados o faltas si ya existe algo.
      ;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
