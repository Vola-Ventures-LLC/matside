-- Fix RLS policy to only allow host teams to view wrestlers from CONFIRMED participating teams
-- This prevents exposure of minor data before a team confirms participation

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Host team can view participating team wrestlers" ON public.wrestlers;

-- Create a more restrictive policy that requires confirmed status
CREATE POLICY "Host team can view confirmed participating team wrestlers"
ON public.wrestlers
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM meets m
    JOIN teams host_team ON host_team.id = m.host_team_id
    JOIN meet_teams mt ON mt.meet_id = m.id
    WHERE host_team.user_id = auth.uid()
      AND mt.team_id = wrestlers.team_id
      AND mt.status = 'confirmed'  -- Only allow access to confirmed teams
  )
);