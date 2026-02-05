-- Migration 014: Add Missing Enum Values
-- Adds missing values to equipment_slot enum.

ALTER TYPE equipment_slot ADD VALUE IF NOT EXISTS 'ears';
ALTER TYPE equipment_slot ADD VALUE IF NOT EXISTS 'outerwear';
ALTER TYPE equipment_slot ADD VALUE IF NOT EXISTS 'shirt';
ALTER TYPE equipment_slot ADD VALUE IF NOT EXISTS 'pants';
ALTER TYPE equipment_slot ADD VALUE IF NOT EXISTS 'belt';
ALTER TYPE equipment_slot ADD VALUE IF NOT EXISTS 'accessory';

