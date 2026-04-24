-- Migration: 033_enable_operations_team_management.sql
-- Description: Enables "operaciones" role to manage missions and EPP assignments
-- for personnel under their charge (same company, non-admin managed roles).

-- 1) Ensure role enum contains operaciones
-- Some environments use enum name `role`, others `user_role`.
DO $$
DECLARE enum_name text;
BEGIN
    SELECT t.typname INTO enum_name
    FROM pg_type t
    WHERE t.typname IN ('role', 'user_role')
    ORDER BY CASE WHEN t.typname = 'role' THEN 0 ELSE 1 END
    LIMIT 1;

    IF enum_name IS NULL THEN
        RAISE EXCEPTION 'No role enum type found (role/user_role).';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = enum_name AND e.enumlabel = 'operaciones'
    ) THEN
        EXECUTE format('ALTER TYPE %I ADD VALUE %L', enum_name, 'operaciones');
    END IF;
END $$;

-- 2) Profiles visibility: admins keep full view, operations can see managed roles in same company
DROP POLICY IF EXISTS "Visibilidad por empresa y departamento" ON profiles;
CREATE POLICY "Visibilidad por empresa y departamento"
ON profiles
FOR SELECT
USING (
    public.get_auth_role() = 'administrador'
    OR id = auth.uid()
    OR (
        public.get_auth_role() = 'operaciones'
        AND company::text = public.get_auth_company()
        AND role::text IN ('tecnico', 'administrativo', 'marketing', 'ventas', 'limpieza')
    )
    OR (
        company::text = public.get_auth_company()
        AND role::text = public.get_auth_role()
    )
);

-- 3) Missions isolation: keep strict visibility and add operations write access for managed roles
DROP POLICY IF EXISTS "Strict mission isolation" ON missions;
CREATE POLICY "Strict mission isolation"
ON missions
FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'administrador'
    OR auth.uid() = ANY(visible_to)
    OR (
        company::text = public.get_auth_company()
        AND (
            role::text = public.get_auth_role()
            OR role IS NULL
            OR (
                public.get_auth_role() = 'operaciones'
                AND role::text IN ('tecnico', 'administrativo', 'marketing', 'ventas', 'limpieza')
            )
        )
    )
);

DROP POLICY IF EXISTS "Operations can manage missions for managed roles" ON missions;
CREATE POLICY "Operations can manage missions for managed roles"
ON missions
FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'operaciones'
    AND company::text = public.get_auth_company()
    AND role::text IN ('tecnico', 'administrativo', 'marketing', 'ventas', 'limpieza')
)
WITH CHECK (
    public.get_auth_role() = 'operaciones'
    AND company::text = public.get_auth_company()
    AND role::text IN ('tecnico', 'administrativo', 'marketing', 'ventas', 'limpieza')
);

-- 4) Inventory catalog visibility for operations (needed for EPP assignment UI)
DROP POLICY IF EXISTS "Operations can view inventory catalog" ON inventory_items;
CREATE POLICY "Operations can view inventory catalog"
ON inventory_items
FOR SELECT
TO authenticated
USING (public.get_auth_role() = 'operaciones');

DROP POLICY IF EXISTS "Operations can view inventory variants" ON inventory_variants;
CREATE POLICY "Operations can view inventory variants"
ON inventory_variants
FOR SELECT
TO authenticated
USING (public.get_auth_role() = 'operaciones');

-- 5) EPP assignment control for operations on user_inventory (same company + managed roles)
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Operations manage team inventory assignments" ON user_inventory;
CREATE POLICY "Operations manage team inventory assignments"
ON user_inventory
FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'operaciones'
    AND EXISTS (
        SELECT 1
        FROM profiles p
        WHERE p.id = user_inventory.user_id
          AND p.company::text = public.get_auth_company()
          AND p.role::text IN ('tecnico', 'administrativo', 'marketing', 'ventas', 'limpieza')
    )
)
WITH CHECK (
    public.get_auth_role() = 'operaciones'
    AND EXISTS (
        SELECT 1
        FROM profiles p
        WHERE p.id = user_inventory.user_id
          AND p.company::text = public.get_auth_company()
          AND p.role::text IN ('tecnico', 'administrativo', 'marketing', 'ventas', 'limpieza')
    )
);
