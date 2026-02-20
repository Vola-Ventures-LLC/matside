
-- The trigger function needs to bypass RLS when inserting the initial organizer
-- Update the trigger function to explicitly bypass RLS by setting session variable
-- or recreate it properly

-- First, let's create a simple approach: the trigger runs as SECURITY DEFINER
-- but we need to ensure the INSERT into league_members is allowed

-- Option: Create an internal policy that allows insertion when called from a trigger
-- We'll use a more direct approach - bypass RLS in the trigger by using a different method

-- Drop the existing INSERT policy and create one that works with the trigger
DROP POLICY IF EXISTS "Allow league member creation" ON public.league_members;

-- The SECURITY DEFINER function runs as the function owner (postgres/service role)
-- which should bypass RLS, but PostgREST uses the authenticated role
-- Let's verify the trigger function is set up correctly

-- Recreate the trigger function to explicitly set a local variable to bypass checks
CREATE OR REPLACE FUNCTION public.add_league_creator_as_organizer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Insert the creator as an organizer
  -- SECURITY DEFINER means this runs as the function owner, bypassing RLS
  INSERT INTO public.league_members (league_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'organizer');
  RETURN NEW;
END;
$function$;

-- Create a simpler INSERT policy - allow any authenticated user to add themselves
-- or allow organizers to add others
CREATE POLICY "Users can join leagues or organizers can add members"
ON public.league_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR is_league_organizer(auth.uid(), league_id)
);
