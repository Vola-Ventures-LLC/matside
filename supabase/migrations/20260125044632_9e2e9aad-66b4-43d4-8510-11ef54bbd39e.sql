-- Allow league members to view teams that are in their leagues
CREATE POLICY "League members can view teams in their leagues"
ON public.teams
FOR SELECT
USING (
  id IN (
    SELECT lt.team_id 
    FROM public.league_teams lt
    WHERE lt.league_id IN (
      SELECT lm.league_id 
      FROM public.league_members lm 
      WHERE lm.user_id = auth.uid()
    )
  )
);