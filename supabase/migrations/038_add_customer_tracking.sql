-- 038_add_customer_tracking.sql
CREATE TABLE IF NOT EXISTS public.customer_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    project_name TEXT NOT NULL,
    company TEXT NOT NULL,
    phone TEXT,
    job_type TEXT,
    requirements TEXT,
    status TEXT DEFAULT 'PENDIENTE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.customer_tracking ENABLE ROW LEVEL SECURITY;

-- Policies
-- Only 'administrador', 'ventas', and 'administrativo' can view and edit
CREATE POLICY "Admin, Sales and Admin roles can view customer tracking"
ON public.customer_tracking FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.role = 'administrador' OR profiles.role = 'ventas' OR profiles.role = 'administrativo')
    )
);

CREATE POLICY "Admin, Sales and Admin roles can insert customer tracking"
ON public.customer_tracking FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.role = 'administrador' OR profiles.role = 'ventas' OR profiles.role = 'administrativo')
    )
);

CREATE POLICY "Admin, Sales and Admin roles can update customer tracking"
ON public.customer_tracking FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.role = 'administrador' OR profiles.role = 'ventas' OR profiles.role = 'administrativo')
    )
);

CREATE POLICY "Admin and Sales can delete customer tracking"
ON public.customer_tracking FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.role = 'administrador' OR profiles.role = 'ventas')
    )
);
