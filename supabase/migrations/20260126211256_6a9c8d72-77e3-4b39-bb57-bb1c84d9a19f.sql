-- Drop and recreate the INSERT policy with explicit settings
DROP POLICY IF EXISTS "Users can create their own teams" ON public.teams;

-- Create a fresh permissive INSERT policy for authenticated users
CREATE POLICY "Users can create their own teams" 
ON public.teams 
AS PERMISSIVE
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Also ensure the authenticated role can use the auth.uid() function
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;