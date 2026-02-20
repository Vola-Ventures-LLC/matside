-- Drop the overly permissive policy that exposes email addresses
DROP POLICY IF EXISTS "Anyone can view invite codes" ON public.invitations;

-- The existing SECURITY DEFINER function get_league_from_invite_code() 
-- already provides a safe way to validate invite codes without exposing emails.
-- League members can still view full invitations through their existing policy.