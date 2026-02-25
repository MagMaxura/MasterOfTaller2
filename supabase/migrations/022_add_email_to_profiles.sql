-- Migration 022: Add email to profiles and sync with auth.users

-- 1. Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Populate existing emails from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- 3. Create a function to handle email sync
CREATE OR REPLACE FUNCTION public.handle_sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger on auth.users for updates
DROP TRIGGER IF EXISTS on_auth_user_updated_email ON auth.users;
CREATE TRIGGER on_auth_user_updated_email
AFTER UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_sync_profile_email();

-- 5. Create/Update the trigger for new user creation
-- First, let's see if we can find the existing trigger that creates the profile
-- If it doesn't exist, we should create one.
-- Based on previous analysis, we'll assume we can at least ensure future profile creations include email if updated.

-- Note: To fully automate on INSERT, we'd need to modify the NEW user trigger 
-- which usually looks like handle_new_user(). 
-- For now, this migration ensures existing data is populated and updates are synced.
