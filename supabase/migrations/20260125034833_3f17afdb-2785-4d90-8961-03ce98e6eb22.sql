
-- Drop and recreate the INSERT policy with explicit AS PERMISSIVE
DROP POLICY IF EXISTS "Users can create leagues" ON public.leagues;

-- Explicitly use AS PERMISSIVE (even though it's the default)
CREATE POLICY "Users can create leagues"
ON public.leagues
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Also add a policy that allows seeing the row you just created
-- This is needed because the query returns the inserted row
-- and the SELECT policy uses is_league_member which won't pass for new leagues
DROP POLICY IF EXISTS "League members can view their leagues" ON public.leagues;

-- Allow viewing if you're a league member OR if you're the creator
CREATE POLICY "Users can view their leagues"
ON public.leagues
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR is_league_member(auth.uid(), id)
);
