-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "League members can view teams in their leagues" ON public.teams;

-- Create a security definer function to check if a team is in a league the user is a member of
CREATE OR REPLACE FUNCTION public.is_team_in_user_league(_team_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.league_teams lt
    JOIN public.league_members lm ON lm.league_id = lt.league_id
    WHERE lt.team_id = _team_id
      AND lm.user_id = _user_id
  )
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "League members can view teams in their leagues"
ON public.teams
FOR SELECT
USING (public.is_team_in_user_league(id, auth.uid()));