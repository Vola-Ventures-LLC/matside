
-- Grant all necessary table-level permissions to authenticated role for teams table
GRANT ALL ON public.teams TO authenticated;

-- Also ensure the role has usage on the public schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify the trigger is properly set up (recreate if needed)
DROP TRIGGER IF EXISTS on_team_created ON public.teams;
CREATE TRIGGER on_team_created
  AFTER INSERT ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.add_team_creator_as_owner();
