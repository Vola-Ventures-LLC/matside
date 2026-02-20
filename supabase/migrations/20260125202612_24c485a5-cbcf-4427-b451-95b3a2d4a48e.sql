-- Add RLS policy to allow guest team managers to view matches they're participating in
CREATE POLICY "Participating team managers can view matches"
ON public.matches
AS PERMISSIVE
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM meets m
    JOIN meet_teams mt ON mt.meet_id = m.id
    WHERE m.id = matches.meet_id
    AND is_team_manager(auth.uid(), mt.team_id)
  )
);

-- Create a profile for users who don't have one (trigger on auth.users sign-in)
-- First, let's create a function to handle this
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();