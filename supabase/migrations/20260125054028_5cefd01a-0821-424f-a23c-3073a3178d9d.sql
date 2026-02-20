-- Create a security definer function to check if user's team is participating in a meet
CREATE OR REPLACE FUNCTION public.is_user_team_in_meet(_meet_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.meet_teams mt
    JOIN public.teams t ON t.id = mt.team_id
    WHERE mt.meet_id = _meet_id
      AND t.user_id = _user_id
  )
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view their meets" ON public.meets;

-- Create fixed policy using the security definer function
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
  -- User's team is participating in the meet (using security definer function)
  is_user_team_in_meet(id, auth.uid())
);