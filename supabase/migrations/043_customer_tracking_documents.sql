-- Migration: 043_customer_tracking_documents.sql
-- Adds document storage columns to customer_tracking and creates the bucket.

-- 1. New columns on customer_tracking
ALTER TABLE public.customer_tracking
  ADD COLUMN IF NOT EXISTS presupuesto_url  TEXT,
  ADD COLUMN IF NOT EXISTS documentos_cliente JSONB DEFAULT '[]'::jsonb;

-- 2. Storage bucket for customer documents (private, auth required)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'customer-docs',
  'customer-docs',
  false,
  20971520, -- 20 MB per file
  ARRAY['application/pdf','image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS on the bucket: only administrador, ventas, administrativo can upload/read
CREATE POLICY "Customer docs: authenticated roles can read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'customer-docs'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('administrador','ventas','administrativo')
  )
);

CREATE POLICY "Customer docs: authenticated roles can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'customer-docs'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('administrador','ventas','administrativo')
  )
);

CREATE POLICY "Customer docs: authenticated roles can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'customer-docs'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('administrador','ventas','administrativo')
  )
);
