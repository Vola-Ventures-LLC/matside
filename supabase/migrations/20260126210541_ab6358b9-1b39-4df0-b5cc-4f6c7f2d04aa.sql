-- Grant necessary permissions to authenticated and anon roles for the teams table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT SELECT ON public.teams TO anon;