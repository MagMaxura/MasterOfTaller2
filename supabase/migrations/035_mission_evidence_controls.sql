-- 035_mission_evidence_controls.sql
-- Enforces mission evidence phases: BEFORE, CHECKPOINT_2H, AFTER, NOTE.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'mission_milestone_type' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.mission_milestone_type AS ENUM ('BEFORE', 'CHECKPOINT_2H', 'AFTER', 'NOTE');
  END IF;
END $$;

ALTER TABLE public.mission_milestones
  ADD COLUMN IF NOT EXISTS milestone_type public.mission_milestone_type NOT NULL DEFAULT 'NOTE';

ALTER TABLE public.mission_milestones
  DROP CONSTRAINT IF EXISTS mission_milestones_photo_required_chk;

ALTER TABLE public.mission_milestones
  ADD CONSTRAINT mission_milestones_photo_required_chk
  CHECK (
    milestone_type = 'NOTE'
    OR image_url IS NOT NULL
  );

CREATE UNIQUE INDEX IF NOT EXISTS mission_milestones_unique_before_idx
  ON public.mission_milestones (mission_id)
  WHERE milestone_type = 'BEFORE';

CREATE UNIQUE INDEX IF NOT EXISTS mission_milestones_unique_after_idx
  ON public.mission_milestones (mission_id)
  WHERE milestone_type = 'AFTER';

CREATE INDEX IF NOT EXISTS mission_milestones_evidence_lookup_idx
  ON public.mission_milestones (mission_id, created_at)
  WHERE milestone_type IN ('BEFORE', 'CHECKPOINT_2H', 'AFTER');

CREATE OR REPLACE FUNCTION public.validate_mission_evidence(
  p_mission_id uuid,
  p_end_at timestamptz DEFAULT now()
)
RETURNS TABLE(is_valid boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before_at timestamptz;
  v_last_point timestamptz;
  v_gap interval;
BEGIN
  SELECT created_at
  INTO v_before_at
  FROM public.mission_milestones
  WHERE mission_id = p_mission_id
    AND milestone_type = 'BEFORE'
    AND image_url IS NOT NULL
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_before_at IS NULL THEN
    RETURN QUERY SELECT false, 'Falta evidencia inicial (ANTES).';
    RETURN;
  END IF;

  WITH points AS (
    SELECT created_at
    FROM public.mission_milestones
    WHERE mission_id = p_mission_id
      AND milestone_type IN ('BEFORE', 'CHECKPOINT_2H', 'AFTER')
      AND image_url IS NOT NULL
      AND created_at >= v_before_at
      AND created_at <= p_end_at
    ORDER BY created_at
  ),
  gaps AS (
    SELECT created_at, created_at - lag(created_at) OVER (ORDER BY created_at) AS gap
    FROM points
  )
  SELECT max(gap), max(created_at)
  INTO v_gap, v_last_point
  FROM gaps;

  IF v_last_point IS NULL THEN
    RETURN QUERY SELECT false, 'No hay evidencias validas para el periodo de la mision.';
    RETURN;
  END IF;

  IF v_gap IS NOT NULL AND v_gap > interval '2 hours 10 minutes' THEN
    RETURN QUERY SELECT false, 'Existe un intervalo mayor a 2 horas entre evidencias fotograficas.';
    RETURN;
  END IF;

  IF (p_end_at - v_last_point) > interval '2 hours 10 minutes' THEN
    RETURN QUERY SELECT false, 'La ultima evidencia supera el limite de 2 horas.';
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'Evidencia validada correctamente.';
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_mission_evidence(uuid, timestamptz) TO authenticated, service_role;
