-- Drop the existing SELECT policy on meets
DROP POLICY IF EXISTS "Users can view their meets" ON public.meets;

-- Create updated policy that includes participating teams
CREATE POLICY "Users can view their meets" 
ON public.meets 
FOR SELECT 
USING (
  -- User owns the host team
  (host_team_id IN (SELECT teams.id FROM teams WHERE teams.user_id = auth.uid()))
  OR 
  -- User is a league member for league meets
  ((league_id IS NOT NULL) AND is_league_member(auth.uid(), league_id))
  OR
  -- User's team is participating in the meet
  (id IN (
    SELECT meet_id FROM meet_teams 
    WHERE team_id IN (SELECT teams.id FROM teams WHERE teams.user_id = auth.uid())
  ))
);