-- Migración 023: Horarios Centralizados
-- Este script crea la tabla de horarios para los técnicos, centralizando la lógica que antes estaba en la App de Cámara.

CREATE TABLE IF NOT EXISTS user_schedules (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    schedule_type TEXT DEFAULT 'FLEXIBLE' CHECK (schedule_type IN ('FIJO', 'FLEXIBLE')),
    start_time TIME WITHOUT TIME ZONE,
    end_time TIME WITHOUT TIME ZONE,
    daily_hours DECIMAL DEFAULT 8.0,
    tolerance_minutes INTEGER DEFAULT 15,
    exit_tolerance_minutes INTEGER DEFAULT 5,
    vacation_start_date DATE,
    vacation_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE user_schedules ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Admins can manage all schedules" 
ON user_schedules FOR ALL 
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Users can view their own schedule" 
ON user_schedules FOR SELECT 
USING (auth.uid() = user_id);

-- Función para actualizar el timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_schedules_updated_at
BEFORE UPDATE ON user_schedules
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Insertar horarios por defecto para técnicos actuales que no tengan
INSERT INTO user_schedules (user_id)
SELECT id FROM profiles
ON CONFLICT (user_id) DO NOTHING;
