-- Add team-level data sharing consent fields
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS data_sharing_consent boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS data_sharing_consent_at timestamptz;

-- Update RLS policy to require consent before wrestlers are visible to host teams
DROP POLICY IF EXISTS "Host team can view confirmed participating team wrestlers" ON public.wrestlers;

CREATE POLICY "Host team can view consented participating team wrestlers"
ON public.wrestlers
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM meets m
    JOIN teams host_team ON host_team.id = m.host_team_id
    JOIN meet_teams mt ON mt.meet_id = m.id
    JOIN teams participating_team ON participating_team.id = mt.team_id
    WHERE host_team.user_id = auth.uid()
      AND mt.team_id = wrestlers.team_id
      AND mt.status = 'confirmed'
      AND participating_team.data_sharing_consent = true  -- Require consent
  )
);