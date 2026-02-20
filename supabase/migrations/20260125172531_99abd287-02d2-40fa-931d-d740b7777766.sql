-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "League members can view invitations" ON public.invitations;

-- Create new policy that only allows league organizers to view invitations
CREATE POLICY "League organizers can view invitations" 
ON public.invitations 
FOR SELECT 
USING (is_league_organizer(auth.uid(), league_id));