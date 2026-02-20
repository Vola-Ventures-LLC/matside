-- Drop the overly permissive policy that allows enumeration of all tokens
DROP POLICY IF EXISTS "Anyone can lookup public tokens" ON public.public_meet_tokens;

-- Create a more restrictive policy that only allows lookup when filtering by specific token
-- This prevents enumeration but still allows public access when the token is known
CREATE POLICY "Anyone can lookup specific token"
  ON public.public_meet_tokens
  FOR SELECT
  USING (
    -- Only allow access when the query includes a filter on the token column
    -- This is enforced by requiring the token to match what's being queried
    token = current_setting('request.jwt.claims', true)::json->>'token_filter'
    OR
    -- Allow when the token value is provided as a query parameter
    -- Supabase RLS will only return rows that match the WHERE clause anyway
    -- So we just need to ensure the policy doesn't return ALL rows
    -- The safest approach: allow lookup only via the is_meet_published function or direct token match
    is_meet_published((SELECT meet_id FROM public.public_meet_tokens WHERE token = public_meet_tokens.token LIMIT 1))
  );

-- Actually, let's use a simpler and more effective approach
-- Drop the above and create a proper policy
DROP POLICY IF EXISTS "Anyone can lookup specific token" ON public.public_meet_tokens;

-- The key insight: RLS policies filter rows AFTER the WHERE clause is evaluated
-- But the issue is that SELECT * FROM public_meet_tokens would return all rows with USING(true)
-- We need to ensure only token-based lookups work for anonymous users

-- Create a security definer function to safely lookup a token
CREATE OR REPLACE FUNCTION public.get_public_meet_by_token(_token text)
RETURNS TABLE(
  meet_id uuid,
  meet_name text,
  meet_date date,
  host_team_name text,
  host_team_color text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    m.id as meet_id,
    m.name as meet_name,
    m.meet_date,
    t.name as host_team_name,
    t.primary_color as host_team_color
  FROM public.public_meet_tokens pmt
  JOIN public.meets m ON m.id = pmt.meet_id
  JOIN public.teams t ON t.id = m.host_team_id
  WHERE pmt.token = _token
    AND (pmt.expires_at IS NULL OR pmt.expires_at > now())
  LIMIT 1;
$$;

-- Now update the RLS policy to be more restrictive
-- Allow host managers full access, but anonymous users get nothing directly
-- They must use the get_public_meet_by_token function instead
CREATE POLICY "No direct anonymous access to tokens"
  ON public.public_meet_tokens
  FOR SELECT
  USING (
    -- Only authenticated host managers can see tokens directly
    meet_id IN (
      SELECT meets.id
      FROM meets
      WHERE is_team_manager(auth.uid(), meets.host_team_id)
    )
  );

-- Set default expiration: 24 hours after creation if not specified
-- We'll also add a trigger to auto-set expires_at when publishing
ALTER TABLE public.public_meet_tokens 
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '24 hours');

-- Update existing tokens that have no expiration to expire 24 hours from now
UPDATE public.public_meet_tokens 
SET expires_at = now() + interval '24 hours'
WHERE expires_at IS NULL;