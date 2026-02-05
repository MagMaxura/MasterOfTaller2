-- Ensure RLS is enabled
ALTER TABLE periodos_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_nomina ENABLE ROW LEVEL SECURITY;

-- 1. Policies for periodos_pago
-- Viewer: Own periods
DROP POLICY IF EXISTS "Users can view own payment periods" ON periodos_pago;
CREATE POLICY "Users can view own payment periods"
ON periodos_pago FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admin: All periods
DROP POLICY IF EXISTS "Admins can view all payment periods" ON periodos_pago;
CREATE POLICY "Admins can view all payment periods"
ON periodos_pago FOR SELECT
TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'administrador');

-- 2. Policies for eventos_nomina
-- Viewer: Own events
DROP POLICY IF EXISTS "Users can view own events" ON eventos_nomina;
CREATE POLICY "Users can view own events"
ON eventos_nomina FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admin: All events
DROP POLICY IF EXISTS "Admins can view all events" ON eventos_nomina;
CREATE POLICY "Admins can view all events"
ON eventos_nomina FOR SELECT
TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'administrador');
