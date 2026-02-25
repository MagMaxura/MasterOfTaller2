-- Migration: 021_mission_isolation.sql
-- Description: Adds company and role to missions for strict isolation.

BEGIN;

-- 1. Add columns to missions table
ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS company company_name,
ADD COLUMN IF NOT EXISTS role user_role;

-- 2. Update existing missions (optional)
-- We can leave them as NULL (global) or set a default.
-- For now, let's keep them NULL which would mean "legacy/global" or manageable by admins.

-- 3. Drop old policies
DROP POLICY IF EXISTS "Admins have full control of missions" ON missions;
DROP POLICY IF EXISTS "Technicians can view visible missions" ON missions;

-- 4. Create new strict isolation policies

-- Policy for Admins: FULL CONTROL
CREATE POLICY "Admins have full control of missions"
ON missions
FOR ALL
TO authenticated
USING (
  public.get_auth_role() = 'administrador'
)
WITH CHECK (
  public.get_auth_role() = 'administrador'
);

-- Policy for Users: Restricted View
-- A user sees a mission if:
-- a) They belong to the same COMPANY AND ROLE (department)
-- b) They are explicitly in the visible_to array
-- c) The mission is "global" (company is NULL AND role is NULL) - optional but useful for onboarding
CREATE POLICY "Strict mission isolation"
ON missions
FOR SELECT
TO authenticated
USING (
  public.get_auth_role() = 'administrador' -- Redundant but safe
  OR 
  (
    (company::text = public.get_auth_company() OR (company IS NULL))
    AND 
    (role::text = public.get_auth_role() OR (role IS NULL))
  )
  OR
  auth.uid() = ANY(visible_to)
);

COMMIT;
