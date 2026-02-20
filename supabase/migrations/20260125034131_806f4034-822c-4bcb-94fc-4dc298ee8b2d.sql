-- Drop all existing league policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "League members can view their leagues" ON public.leagues;
DROP POLICY IF EXISTS "League organizers can delete their leagues" ON public.leagues;
DROP POLICY IF EXISTS "League organizers can update their leagues" ON public.leagues;
DROP POLICY IF EXISTS "Users can create leagues" ON public.leagues;

-- Recreate all policies as PERMISSIVE (which is the default, but being explicit)
CREATE POLICY "League members can view their leagues" 
ON public.leagues 
FOR SELECT 
TO authenticated
USING (is_league_member(auth.uid(), id));

CREATE POLICY "League organizers can delete their leagues" 
ON public.leagues 
FOR DELETE 
TO authenticated
USING (is_league_organizer(auth.uid(), id));

CREATE POLICY "League organizers can update their leagues" 
ON public.leagues 
FOR UPDATE 
TO authenticated
USING (is_league_organizer(auth.uid(), id));

CREATE POLICY "Users can create leagues" 
ON public.leagues 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);