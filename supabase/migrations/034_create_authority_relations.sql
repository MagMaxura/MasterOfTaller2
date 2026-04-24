-- Migration: 034_create_authority_relations.sql
-- Description: Creates authority graph (manager -> subordinate) for visual org chart.

CREATE TABLE IF NOT EXISTS authority_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subordinate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT authority_self_reference_check CHECK (manager_id <> subordinate_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_authority_active_subordinate
ON authority_relations (subordinate_id)
WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS ix_authority_manager_active
ON authority_relations (manager_id, active);

CREATE INDEX IF NOT EXISTS ix_authority_subordinate_active
ON authority_relations (subordinate_id, active);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_authority_relations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_authority_relations_updated_at ON authority_relations;
CREATE TRIGGER trg_update_authority_relations_updated_at
BEFORE UPDATE ON authority_relations
FOR EACH ROW
EXECUTE PROCEDURE update_authority_relations_updated_at();

ALTER TABLE authority_relations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and operations manage authority relations" ON authority_relations;
CREATE POLICY "Admins and operations manage authority relations"
ON authority_relations
FOR ALL
TO authenticated
USING (
    public.get_auth_role() IN ('administrador', 'operaciones')
)
WITH CHECK (
    public.get_auth_role() IN ('administrador', 'operaciones')
);

DROP POLICY IF EXISTS "Authenticated can view authority relations" ON authority_relations;
CREATE POLICY "Authenticated can view authority relations"
ON authority_relations
FOR SELECT
TO authenticated
USING (TRUE);

