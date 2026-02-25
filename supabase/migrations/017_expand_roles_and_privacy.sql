-- Migration: 017_expand_roles_and_privacy.sql
-- Description: Adds new roles and implements restricted visibility by department.

-- 1. Add new roles to the existing ENUM
-- We use 'IF NOT EXISTS' logic via a DO block because ADD VALUE cannot be executed in a transaction block with other commands usually,
-- but in Supabase migrations it's generally fine. To be safe:
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'role' AND e.enumlabel = 'administrativo') THEN
        ALTER TYPE role ADD VALUE 'administrativo';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'role' AND e.enumlabel = 'marketing') THEN
        ALTER TYPE role ADD VALUE 'marketing';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'role' AND e.enumlabel = 'ventas') THEN
        ALTER TYPE role ADD VALUE 'ventas';
    END IF;
END $$;

-- 2. Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop old visibility policies if they exist (to ensure clean slate)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Visibilidad por departamento" ON profiles;
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON profiles;

-- 4. Create restricted visibility policy
-- A user sees:
-- a) Everyone if they are 'administrador'
-- b) People in their own department
-- c) Their own profile
CREATE POLICY "Visibilidad por departamento"
ON profiles
FOR SELECT
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'administrador'
  OR 
  role = (SELECT role FROM profiles WHERE id = auth.uid())
  OR
  id = auth.uid()
);

-- 5. Create admin management policy
CREATE POLICY "Admins can do everything on profiles"
ON profiles
FOR ALL
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'administrador'
);
