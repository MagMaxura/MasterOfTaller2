-- Migration: 019_fix_rls_recursion.sql
-- Description: Fixes infinite recursion in profiles RLS policies using security definer functions.

-- 1. Create helper functions with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.get_auth_role() 
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role::TEXT FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_auth_company() 
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT company::TEXT FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the problematic recursive policies
DROP POLICY IF EXISTS "Visibilidad por empresa y departamento" ON profiles;
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON profiles;

-- 3. Create new non-recursive policies
CREATE POLICY "Visibilidad por empresa y departamento"
ON profiles
FOR SELECT
USING (
  public.get_auth_role() = 'administrador'
  OR 
  (
    company::TEXT = public.get_auth_company()
    AND 
    role::TEXT = public.get_auth_role()
  )
  OR
  id = auth.uid()
);

CREATE POLICY "Admins can do everything on profiles"
ON profiles
FOR ALL
USING (
  public.get_auth_role() = 'administrador'
);
