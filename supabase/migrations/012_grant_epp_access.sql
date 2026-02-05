-- Function to check if a user has a specific badge
DROP FUNCTION IF EXISTS user_has_badge(uuid, text) CASCADE;

CREATE OR REPLACE FUNCTION user_has_badge(user_uuid uuid, badge_name_param text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = user_uuid
        AND b.name = badge_name_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS just in case
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_variants ENABLE ROW LEVEL SECURITY;

-- Policy for inventory_items
DROP POLICY IF EXISTS "EPP Admins select inventory items" ON inventory_items;
DROP POLICY IF EXISTS "EPP Admins insert inventory items" ON inventory_items;
DROP POLICY IF EXISTS "EPP Admins update inventory items" ON inventory_items;
DROP POLICY IF EXISTS "EPP Admins delete inventory items" ON inventory_items;
-- Consolidate to one "ALL" policy if possible, or split if needed.
-- Let's use individual policies to be cleaner if they exist, but one ALL is easier to manage.

DROP POLICY IF EXISTS "EPP Admins manage inventory items" ON inventory_items;

CREATE POLICY "EPP Admins manage inventory items"
ON inventory_items
FOR ALL
USING (
    user_has_badge(auth.uid(), 'Administrador de EPP') OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'administrador'
)
WITH CHECK (
    user_has_badge(auth.uid(), 'Administrador de EPP') OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'administrador'
);

-- Policies for inventory_variants
DROP POLICY IF EXISTS "EPP Admins manage inventory variants" ON inventory_variants;

CREATE POLICY "EPP Admins manage inventory variants"
ON inventory_variants
FOR ALL
USING (
    user_has_badge(auth.uid(), 'Administrador de EPP') OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'administrador'
)
WITH CHECK (
    user_has_badge(auth.uid(), 'Administrador de EPP') OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'administrador'
);
