-- Drop and recreate the INSERT policy explicitly as PERMISSIVE
DROP POLICY IF EXISTS "Users can create their own teams" ON public.teams;

CREATE POLICY "Users can create their own teams" 
ON public.teams 
AS PERMISSIVE
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);