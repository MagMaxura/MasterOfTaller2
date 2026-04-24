-- 036_enforce_technician_milestone_geo.sql
-- Ensure technician milestones include geolocation metadata.

ALTER TABLE public.mission_milestones
  ADD COLUMN IF NOT EXISTS captured_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS captured_lat double precision,
  ADD COLUMN IF NOT EXISTS captured_lng double precision,
  ADD COLUMN IF NOT EXISTS location_accuracy_m double precision,
  ADD COLUMN IF NOT EXISTS exif_taken_at timestamptz;

CREATE OR REPLACE FUNCTION public.enforce_technician_milestone_geo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = NEW.user_id;

  IF v_role = 'tecnico' THEN
    IF NEW.captured_lat IS NULL OR NEW.captured_lng IS NULL THEN
      RAISE EXCEPTION 'Los hitos de tecnicos requieren ubicacion (lat/lng).';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_technician_milestone_geo ON public.mission_milestones;
CREATE TRIGGER trg_enforce_technician_milestone_geo
BEFORE INSERT OR UPDATE ON public.mission_milestones
FOR EACH ROW
EXECUTE FUNCTION public.enforce_technician_milestone_geo();
