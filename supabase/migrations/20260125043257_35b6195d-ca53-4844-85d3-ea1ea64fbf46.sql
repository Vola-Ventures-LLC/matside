-- Create a function to get league info from a valid invitation code
-- This bypasses RLS so users can see the league name before joining
CREATE OR REPLACE FUNCTION public.get_league_from_invite_code(invite_code text)
RETURNS TABLE(
  league_id uuid,
  league_name text,
  league_color text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    l.id as league_id,
    l.name as league_name,
    l.primary_color as league_color
  FROM invitations i
  JOIN leagues l ON l.id = i.league_id
  WHERE i.code = invite_code
    AND i.expires_at > now()
    AND i.use_count < i.max_uses
  LIMIT 1;
$$;