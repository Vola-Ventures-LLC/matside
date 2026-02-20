-- Create wrestler flags table for matchup call discussions
CREATE TABLE public.wrestler_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meet_id UUID NOT NULL,
  wrestler_id UUID NOT NULL,
  team_id UUID NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(meet_id, wrestler_id) -- One flag per wrestler per meet
);

-- Enable RLS
ALTER TABLE public.wrestler_flags ENABLE ROW LEVEL SECURITY;

-- All teams in the meet can view flags
CREATE POLICY "Teams in meet can view flags"
ON public.wrestler_flags
FOR SELECT
USING (
  is_user_team_in_meet(meet_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM meets m
    JOIN teams t ON t.id = m.host_team_id
    WHERE m.id = meet_id AND t.user_id = auth.uid()
  )
);

-- Only the team that owns the wrestler can create flags
CREATE POLICY "Teams can flag their own wrestlers"
ON public.wrestler_flags
FOR INSERT
WITH CHECK (
  team_id IN (SELECT id FROM teams WHERE user_id = auth.uid())
);

-- Only the team that created the flag can update it
CREATE POLICY "Teams can update their own flags"
ON public.wrestler_flags
FOR UPDATE
USING (
  team_id IN (SELECT id FROM teams WHERE user_id = auth.uid())
);

-- Only the team that created the flag can delete it
CREATE POLICY "Teams can delete their own flags"
ON public.wrestler_flags
FOR DELETE
USING (
  team_id IN (SELECT id FROM teams WHERE user_id = auth.uid())
);

-- Add trigger for updated_at
CREATE TRIGGER update_wrestler_flags_updated_at
BEFORE UPDATE ON public.wrestler_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();