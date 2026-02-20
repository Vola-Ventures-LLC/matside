-- Create a security definer function to check if user shares a meet with a team
CREATE OR REPLACE FUNCTION public.shares_meet_with_team(_team_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- User's teams
    SELECT 1
    FROM public.meet_teams mt1
    JOIN public.teams t ON t.id = mt1.team_id AND t.user_id = _user_id
    -- Teams in the same meet
    JOIN public.meet_teams mt2 ON mt2.meet_id = mt1.meet_id
    WHERE mt2.team_id = _team_id
  )
  OR EXISTS (
    -- User is host of a meet where the team is participating
    SELECT 1
    FROM public.meets m
    JOIN public.teams t ON t.id = m.host_team_id AND t.user_id = _user_id
    JOIN public.meet_teams mt ON mt.meet_id = m.id
    WHERE mt.team_id = _team_id
  )
  OR EXISTS (
    -- Team is host of a meet where user's team is participating
    SELECT 1
    FROM public.meets m
    WHERE m.host_team_id = _team_id
    AND EXISTS (
      SELECT 1 
      FROM public.meet_teams mt
      JOIN public.teams t ON t.id = mt.team_id AND t.user_id = _user_id
      WHERE mt.meet_id = m.id
    )
  )
$$;

-- Add RLS policy to allow viewing teams that share a meet
CREATE POLICY "Users can view teams they share meets with"
ON public.teams
FOR SELECT
USING (shares_meet_with_team(id, auth.uid()));