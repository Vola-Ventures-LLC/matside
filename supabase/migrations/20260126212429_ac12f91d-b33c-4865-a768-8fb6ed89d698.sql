-- Drop the existing SELECT policy on seasons
DROP POLICY IF EXISTS "Users can view their seasons" ON public.seasons;

-- Create updated policy that allows:
-- 1. League members (organizers/admins) to view league seasons
-- 2. Team managers whose team is in the league to view league seasons
-- 3. Team owners to view their team seasons
CREATE POLICY "Users can view their seasons" 
ON public.seasons 
FOR SELECT 
USING (
  -- League members can view league seasons
  ((league_id IS NOT NULL) AND is_league_member(auth.uid(), league_id))
  OR
  -- Teams in a league can view that league's seasons
  ((league_id IS NOT NULL) AND EXISTS (
    SELECT 1 FROM public.league_teams lt
    JOIN public.team_members tm ON tm.team_id = lt.team_id
    WHERE lt.league_id = seasons.league_id
      AND lt.status = 'active'
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
  ))
  OR
  -- Team owners can view their team seasons
  ((team_id IS NOT NULL) AND is_team_manager(auth.uid(), team_id))
);