-- Enable RLS on Payroll Tables
ALTER TABLE periodos_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_nomina ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- Policies for 'periodos_pago'
-- ----------------------------------------------------

-- 1. Admins have FULL access
CREATE POLICY "Admins have full access on periodos_pago"
ON periodos_pago
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'administrador'
  )
);

-- 2. Users can VIEW their own periods
CREATE POLICY "Users can view own periods"
ON periodos_pago
FOR SELECT
USING (
  user_id = auth.uid()
);

-- ----------------------------------------------------
-- Policies for 'eventos_nomina'
-- ----------------------------------------------------

-- 1. Admins have FULL access
CREATE POLICY "Admins have full access on eventos_nomina"
ON eventos_nomina
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'administrador'
  )
);

-- 2. Users can VIEW their own events
CREATE POLICY "Users can view own events"
ON eventos_nomina
FOR SELECT
USING (
  user_id = auth.uid()
);
