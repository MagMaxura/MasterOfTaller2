-- Migration: 018_add_companies_and_isolation.sql
-- Description: Adds company field to profiles and updates RLS for strict isolation.

-- 1. Create enum for company names
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_name') THEN
        CREATE TYPE company_name AS ENUM ('GREEN HABITAT', 'POTABILIZAR', 'ROSERMAN', 'ULTRASHINE');
    END IF;
END $$;

-- 2. Add company column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS company company_name;

-- 3. Update existing profiles to a default company if needed
-- For now, we leave them as NULL or assign a default. 
-- Let's assign NULL to allow manual assignment via UI.

-- 4. Re-enable RLS (just in case)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Drop old visibility policies
DROP POLICY IF EXISTS "Visibilidad por departamento" ON profiles;

-- 6. Create new strict isolation policy
-- A user sees:
-- a) Everyone if they are 'administrador'
-- b) People in their own COMPANY AND their own DEPARTMENT (role)
-- c) Their own profile
CREATE POLICY "Visibilidad por empresa y departamento"
ON profiles
FOR SELECT
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'administrador'
  OR 
  (
    company = (SELECT company FROM profiles WHERE id = auth.uid())
    AND 
    role = (SELECT role FROM profiles WHERE id = auth.uid())
  )
  OR
  id = auth.uid()
);

-- 7. Ensure admins can still do everything
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON profiles;
CREATE POLICY "Admins can do everything on profiles"
ON profiles
FOR ALL
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'administrador'
);
