CREATE TABLE recurring_incomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    period TEXT NOT NULL,
    invoice_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE recurring_incomes ENABLE ROW LEVEL SECURITY;

-- Policy to allow only 'administrador' to access/modify
CREATE POLICY "SuperAdmins can do everything on recurring_incomes"
ON recurring_incomes
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'administrador'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'administrador'
    )
);
