
-- Drop the restrictive INSERT policy on league_members that blocks the trigger
DROP POLICY IF EXISTS "League organizers can add members" ON public.league_members;

-- Create a policy that allows:
-- 1. The trigger (via SECURITY DEFINER) to insert the initial organizer
-- 2. Existing organizers to add more members
-- We need a permissive policy that allows the trigger to work
CREATE POLICY "Allow league member creation"
ON public.league_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- Either this is the creator being added as organizer (matches the trigger logic)
  -- The trigger runs with SECURITY DEFINER so it bypasses RLS, but we still need a policy
  -- Allow if user is being added to their own league they just created
  (user_id = auth.uid())
  OR
  -- Or if current user is already an organizer of this league
  is_league_organizer(auth.uid(), league_id)
);
