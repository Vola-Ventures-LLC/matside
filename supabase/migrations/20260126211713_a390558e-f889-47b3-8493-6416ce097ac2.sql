-- Drop the current INSERT policy
DROP POLICY IF EXISTS "Users can create their own teams" ON public.teams;

-- Create INSERT policy using standard pattern (no TO clause, just auth.uid check)
CREATE POLICY "Users can create their own teams" 
ON public.teams 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Also verify the role has INSERT permission on the table itself
GRANT INSERT ON public.teams TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;