-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create leagues" ON public.leagues;

-- Create a PERMISSIVE INSERT policy (default is permissive)
CREATE POLICY "Users can create leagues" 
ON public.leagues 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);