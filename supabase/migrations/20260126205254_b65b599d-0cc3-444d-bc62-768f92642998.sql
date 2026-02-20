-- Drop the existing restrictive INSERT policy and recreate as permissive
DROP POLICY IF EXISTS "Users can create their own teams" ON public.teams;

CREATE POLICY "Users can create their own teams" 
ON public.teams 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);