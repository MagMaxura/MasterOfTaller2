-- Migration: 020_expand_role_enum.sql
-- Description: Adds new roles to the user_role enum.

-- Note: ALTER TYPE ... ADD VALUE cannot be executed inside a transaction block in some Postgres versions.
-- This script should be run with autocommit or individually.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'administrativo';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'marketing';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ventas';
