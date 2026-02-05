-- Ensure Admin has FULL control over missions, bypassing any restrictive checks
-- This policy ensures that for the 'missions' table, admins can do EVERYTHING.

BEGIN;

-- 1. Drop existing policies on missions to prevent conflicts (optional but safer if we want to redefine)
-- We will just ADD a specific Admin Override policy that uses a broad condition.
-- Supposing we have RLS enabled.

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- 2. Create/Replace Policy for Admins
DROP POLICY IF EXISTS "Admins have full control of missions" ON missions;

CREATE POLICY "Admins have full control of missions"
ON missions
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'administrador'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'administrador'
  )
);


-- 3. Policy for Technicians: View Only
-- They can see missions where they are in the 'visible_to' array.
CREATE POLICY "Technicians can view visible missions"
ON missions
FOR SELECT
TO authenticated
USING (
  auth.uid() = ANY(visible_to)
);

COMMIT;
