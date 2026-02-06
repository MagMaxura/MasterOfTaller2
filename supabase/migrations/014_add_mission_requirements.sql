-- Create mission_requirements table
CREATE TABLE IF NOT EXISTS mission_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC DEFAULT 1,
    is_purchased BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE mission_requirements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view mission requirements"
ON mission_requirements FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Authenticated users can manage mission requirements"
ON mission_requirements FOR ALL
TO authenticated
USING (TRUE); -- Usually restricted to admins or assigned technicians, but for now we follow the general pattern of the app
