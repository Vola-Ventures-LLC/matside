-- Create team_invitations table for code-based invites
CREATE TABLE public.team_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE DEFAULT SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_uses INTEGER DEFAULT 1,
  use_count INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Team managers can view their team's invitations
CREATE POLICY "Team managers can view team invitations"
ON public.team_invitations
FOR SELECT
USING (is_team_manager(auth.uid(), team_id));

-- Team owners can create invitations
CREATE POLICY "Team owners can create team invitations"
ON public.team_invitations
FOR INSERT
WITH CHECK (is_team_owner(auth.uid(), team_id));

-- Team owners can update invitations
CREATE POLICY "Team owners can update team invitations"
ON public.team_invitations
FOR UPDATE
USING (is_team_owner(auth.uid(), team_id));

-- Team owners can delete invitations
CREATE POLICY "Team owners can delete team invitations"
ON public.team_invitations
FOR DELETE
USING (is_team_owner(auth.uid(), team_id));

-- Function to get team info from invite code (public, for verification)
CREATE OR REPLACE FUNCTION public.get_team_from_invite_code(invite_code TEXT)
RETURNS TABLE (team_id UUID, team_name TEXT, team_color TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name, t.primary_color
  FROM team_invitations ti
  JOIN teams t ON t.id = ti.team_id
  WHERE ti.code = invite_code
    AND ti.expires_at > now()
    AND (ti.max_uses IS NULL OR ti.use_count < ti.max_uses);
END;
$$;

-- Function to redeem team invite code atomically
CREATE OR REPLACE FUNCTION public.redeem_team_invite_code(invite_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get and validate the invitation
  SELECT ti.team_id INTO v_team_id
  FROM team_invitations ti
  WHERE ti.code = invite_code
    AND ti.expires_at > now()
    AND (ti.max_uses IS NULL OR ti.use_count < ti.max_uses);

  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = v_team_id AND user_id = v_user_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'You are already a member of this team';
  END IF;

  -- Increment use count
  UPDATE team_invitations
  SET use_count = use_count + 1
  WHERE code = invite_code;

  -- Add user as team member with 'manager' role
  INSERT INTO team_members (team_id, user_id, role, status)
  VALUES (v_team_id, v_user_id, 'manager', 'active')
  ON CONFLICT (team_id, user_id) 
  DO UPDATE SET status = 'active', archived_at = NULL;

  RETURN v_team_id;
END;
$$;