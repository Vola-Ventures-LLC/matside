-- Allow team managers to add their own team to a league (via invite code)
DROP POLICY IF EXISTS "League organizers can add teams" ON public.league_teams;

-- Recreate the policy to also allow team managers to join their team
CREATE POLICY "Teams can join leagues or organizers can add"
ON public.league_teams
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  -- Team manager can join their own team
  (team_id IN (SELECT id FROM teams WHERE user_id = auth.uid()))
  OR
  -- League organizer can add teams
  is_league_organizer(auth.uid(), league_id)
);