-- Create atomic function to redeem an invite code
-- Returns the league_id if successful, null if code is invalid/exhausted
CREATE OR REPLACE FUNCTION public.redeem_invite_code(invite_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_league_id uuid;
BEGIN
  -- Atomically increment use_count and return league_id only if valid
  UPDATE public.invitations
  SET use_count = use_count + 1
  WHERE code = invite_code
    AND expires_at > now()
    AND use_count < max_uses
  RETURNING league_id INTO v_league_id;
  
  RETURN v_league_id;
END;
$$;