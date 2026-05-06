-- 039_add_permissions_system.sql
CREATE TABLE IF NOT EXISTS public.module_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role public.role, -- Using the existing role enum
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    company TEXT, -- Using Company enum as string
    module_id TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role, module_id),
    UNIQUE(user_id, module_id),
    UNIQUE(company, module_id)
);

-- Enable RLS
ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;

-- Policies
-- Only 'administrador' can view and manage permissions
CREATE POLICY "Admins can view and manage module permissions"
ON public.module_permissions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'administrador'
    )
);

-- Profiles can read their own permissions or those of their role/company
CREATE POLICY "Profiles can read relevant permissions"
ON public.module_permissions FOR SELECT
USING (
    role IS NOT NULL AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
    OR (company IS NOT NULL AND company = (SELECT company FROM public.profiles WHERE id = auth.uid()))
);

-- Initial Seeding based on current logic
-- ADMINISTRADOR (Has access to everything by default)
INSERT INTO public.module_permissions (role, module_id, is_enabled) VALUES 
('administrador', 'manage', true),
('administrador', 'missions', true),
('administrador', 'requests', true),
('administrador', 'payroll', true),
('administrador', 'loans', true),
('administrador', 'leaderboard', true),
('administrador', 'create', true),
('administrador', 'stock', true),
('administrador', 'supplies', true),
('administrador', 'calendar', true),
('administrador', 'live_map', true),
('administrador', 'recurring_incomes', true),
('administrador', 'customers', true);

-- VENTAS (Sales)
INSERT INTO public.module_permissions (role, module_id, is_enabled) VALUES 
('ventas', 'customers', true),
('ventas', 'missions', true),
('ventas', 'leaderboard', true);

-- ADMINISTRATIVO (Administrative)
INSERT INTO public.module_permissions (role, module_id, is_enabled) VALUES 
('administrativo', 'customers', true),
('administrativo', 'payroll', true),
('administrativo', 'leaderboard', true);

-- OPERACIONES (Operations)
INSERT INTO public.module_permissions (role, module_id, is_enabled) VALUES 
('operaciones', 'missions', true),
('operaciones', 'requests', true),
('operaciones', 'stock', true),
('operaciones', 'supplies', true);
