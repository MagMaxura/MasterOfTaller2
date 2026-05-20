-- Migration: 044_technician_locations_and_messages.sql

-- 1. Real-time technician location (separate table for high-frequency upserts)
CREATE TABLE IF NOT EXISTS public.technician_locations (
    user_id         UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    accuracy_m      FLOAT,
    is_online       BOOLEAN DEFAULT true,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.technician_locations ENABLE ROW LEVEL SECURITY;

-- Technicians can upsert their own location
CREATE POLICY "Technicians upsert own location"
ON public.technician_locations FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins and managers can read all locations
CREATE POLICY "Admins read all locations"
ON public.technician_locations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('administrador','operaciones')
    )
);

-- Enable real-time replication for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.technician_locations;

-- 2. Messages (WhatsApp-style chat between admin and any user)
CREATE TABLE IF NOT EXISTS public.messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    read_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can see messages where they are sender or receiver
CREATE POLICY "Users see own messages"
ON public.messages FOR SELECT
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Users can send messages
CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (sender_id = auth.uid());

-- Users can mark their received messages as read
CREATE POLICY "Receivers can mark read"
ON public.messages FOR UPDATE
USING (receiver_id = auth.uid());

-- Enable real-time replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
