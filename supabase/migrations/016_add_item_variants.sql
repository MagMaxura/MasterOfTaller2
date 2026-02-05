-- Migration 016: Add Inventory Variants (Sizes)
-- Creates a table for item variants and updates user_inventory to reference them.

-- 1. Create inventory_variants table
CREATE TABLE IF NOT EXISTS inventory_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(item_id, size)
);

-- 2. Add RLS policies for variants (same as items)
ALTER TABLE inventory_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variants are viewable by everyone" 
ON inventory_variants FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert variants" 
ON inventory_variants FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'administrador')
);

CREATE POLICY "Admins can update variants" 
ON inventory_variants FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'administrador')
);

CREATE POLICY "Admins can delete variants" 
ON inventory_variants FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'administrador')
);

-- 3. Update user_inventory to link to variants
ALTER TABLE user_inventory 
ADD COLUMN variant_id UUID REFERENCES inventory_variants(id) ON DELETE SET NULL;

-- 4. Seed Variants for specific items
DO $$
DECLARE
    shoe_id UUID;
    shirt_id UUID;
    jacket_id UUID;
    pants_id UUID;
BEGIN
    SELECT id INTO shoe_id FROM inventory_items WHERE name LIKE '%Zapatos%' LIMIT 1;
    SELECT id INTO shirt_id FROM inventory_items WHERE name LIKE '%Remera%' LIMIT 1;
    SELECT id INTO jacket_id FROM inventory_items WHERE name LIKE '%Campera%' LIMIT 1;
    SELECT id INTO pants_id FROM inventory_items WHERE name LIKE '%Pantalones%' LIMIT 1;

    -- Shoes (38-46)
    IF shoe_id IS NOT NULL THEN
        INSERT INTO inventory_variants (item_id, size, quantity) VALUES
        (shoe_id, '38', 5), (shoe_id, '39', 5), (shoe_id, '40', 5), (shoe_id, '41', 5),
        (shoe_id, '42', 5), (shoe_id, '43', 5), (shoe_id, '44', 5), (shoe_id, '45', 5), (shoe_id, '46', 5)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Shirts (M-XXXL)
    IF shirt_id IS NOT NULL THEN
        INSERT INTO inventory_variants (item_id, size, quantity) VALUES
        (shirt_id, 'M', 5), (shirt_id, 'L', 5), (shirt_id, 'XL', 5), (shirt_id, 'XXL', 5), (shirt_id, 'XXXL', 5)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Jackets (M-XXXL)
    IF jacket_id IS NOT NULL THEN
        INSERT INTO inventory_variants (item_id, size, quantity) VALUES
        (jacket_id, 'M', 5), (jacket_id, 'L', 5), (jacket_id, 'XL', 5), (jacket_id, 'XXL', 5), (jacket_id, 'XXXL', 5)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Pants (38-52, even)
    IF pants_id IS NOT NULL THEN
        INSERT INTO inventory_variants (item_id, size, quantity) VALUES
        (pants_id, '38', 5), (pants_id, '40', 5), (pants_id, '42', 5), (pants_id, '44', 5), 
        (pants_id, '46', 5), (pants_id, '48', 5), (pants_id, '50', 5), (pants_id, '52', 5)
        ON CONFLICT DO NOTHING;
    END IF;

END $$;
