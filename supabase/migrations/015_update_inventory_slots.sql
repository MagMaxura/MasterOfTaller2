-- Migration 015: Update Inventory Slot Data
-- Updates the inventory items to use the newly added enum values.

-- 1. Fix "Protection Auditiva" (Ear Protection) -> 'ears'
UPDATE inventory_items
SET slot = 'ears'
WHERE name LIKE '%Auditiva%';

-- 2. Fix "Campera" (Jacket) -> 'outerwear'
UPDATE inventory_items
SET slot = 'outerwear'
WHERE name LIKE '%Campera%';

-- 3. Fix "Remera" (Shirt) -> 'shirt'
UPDATE inventory_items
SET slot = 'shirt'
WHERE name LIKE '%Remera%';

-- 4. Fix "Pantalones" (Pants) -> 'pants'
UPDATE inventory_items
SET slot = 'pants'
WHERE name LIKE '%Pantalones%';

-- 5. Fix "Lentes" -> 'face' (Already correct, but reinforcing)
UPDATE inventory_items
SET slot = 'face'
WHERE name LIKE '%Lentes%';

-- 6. Fix "Zapatos" -> 'feet'
UPDATE inventory_items
SET slot = 'feet'
WHERE name LIKE '%Zapatos%';

-- 7. Fix "Guantes" -> 'hands'
UPDATE inventory_items
SET slot = 'hands'
WHERE name LIKE '%Guantes%';
