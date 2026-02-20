-- Recreate the trigger function with explicit SECURITY DEFINER and search_path
CREATE OR REPLACE FUNCTION public.add_team_creator_as_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role, status)
  VALUES (NEW.id, NEW.user_id, 'owner', 'active');
  RETURN NEW;
END;
$function$;

-- Drop and recreate the trigger to ensure it's attached correctly
DROP TRIGGER IF EXISTS on_team_created ON public.teams;

CREATE TRIGGER on_team_created
  AFTER INSERT ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.add_team_creator_as_owner();