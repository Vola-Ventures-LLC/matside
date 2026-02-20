-- Drop and recreate with public role to match other policies
DROP POLICY IF EXISTS "Users can create their own teams" ON public.teams;

CREATE POLICY "Users can create their own teams" 
ON public.teams 
FOR INSERT 
TO public
WITH CHECK (auth.uid() = user_id);