-- Create team_members table for multi-manager support
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('owner', 'manager')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  UNIQUE(team_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_members_active ON public.team_members(team_id, user_id) WHERE status = 'active';

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is an active team manager (any role)
CREATE OR REPLACE FUNCTION public.is_team_manager(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE user_id = _user_id
      AND team_id = _team_id
      AND status = 'active'
  )
$$;

-- Helper function: Check if user is the team owner
CREATE OR REPLACE FUNCTION public.is_team_owner(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE user_id = _user_id
      AND team_id = _team_id
      AND role = 'owner'
      AND status = 'active'
  )
$$;

-- RLS Policies for team_members

-- Team members can view other members of their teams
CREATE POLICY "Team members can view team members"
ON public.team_members
FOR SELECT
USING (is_team_manager(auth.uid(), team_id));

-- Active managers can add new members
CREATE POLICY "Team managers can add members"
ON public.team_members
FOR INSERT
WITH CHECK (is_team_manager(auth.uid(), team_id));

-- Active managers can update members (archive/restore)
CREATE POLICY "Team managers can update members"
ON public.team_members
FOR UPDATE
USING (is_team_manager(auth.uid(), team_id));

-- Only owners can delete members (but typically we archive instead)
CREATE POLICY "Team owners can delete members"
ON public.team_members
FOR DELETE
USING (is_team_owner(auth.uid(), team_id));

-- Trigger to auto-create team_members row when a new team is created
CREATE OR REPLACE FUNCTION public.add_team_creator_as_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role, status)
  VALUES (NEW.id, NEW.user_id, 'owner', 'active');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_team_created
AFTER INSERT ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.add_team_creator_as_owner();

-- Migrate existing teams: create team_members rows for current owners
INSERT INTO public.team_members (team_id, user_id, role, status, created_at)
SELECT id, user_id, 'owner', 'active', created_at
FROM public.teams
ON CONFLICT (team_id, user_id) DO NOTHING;