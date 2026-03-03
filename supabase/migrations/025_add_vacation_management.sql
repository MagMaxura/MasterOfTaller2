-- Migración 025: Gestión de Vacaciones
-- Agrega soporte para seguimiento de saldos y solicitudes históricas de vacaciones.

-- 1. Actualizar tabla profiles con saldos de vacaciones
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS vacation_total_days INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS vacation_remaining_days INTEGER DEFAULT 15;

-- 2. Crear tabla de solicitudes de vacaciones
CREATE TABLE IF NOT EXISTS vacation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDIENTE', 'APROBADA', 'RECHAZADA')) DEFAULT 'PENDIENTE',
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Restricción para evitar fechas invertidas
    CONSTRAINT valid_dates CHECK (start_date <= end_date)
);

-- 3. Habilitar RLS
ALTER TABLE vacation_requests ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de RLS
CREATE POLICY "Admins can manage all vacation requests" 
ON vacation_requests FOR ALL 
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'administrador'))
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'administrador'));

CREATE POLICY "Users can view their own requests" 
ON vacation_requests FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests" 
ON vacation_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. Eliminar columnas obsoletas de user_schedules (Opcional, pero recomendado)
-- ALTER TABLE user_schedules DROP COLUMN IF EXISTS vacation_start_date;
-- ALTER TABLE user_schedules DROP COLUMN IF EXISTS vacation_end_date;

-- 6. Indices
CREATE INDEX IF NOT EXISTS idx_vacation_requests_user_id ON vacation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_vacation_requests_status ON vacation_requests(status);
