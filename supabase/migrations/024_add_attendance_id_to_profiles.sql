-- Migration: 024_add_attendance_id_to_profiles.sql
-- Description: Adds attendance_id column to profiles for manual linking with biometric devices.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS attendance_id TEXT;

-- Index for faster lookups if needed (though profiles is usually small)
CREATE INDEX IF NOT EXISTS idx_profiles_attendance_id ON profiles(attendance_id);
