-- Create meet_rules table for meet-specific pairing configuration
CREATE TABLE public.meet_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meet_id UUID NOT NULL UNIQUE REFERENCES public.meets(id) ON DELETE CASCADE,
  
  -- Matching priorities (1-4, lower = higher priority)
  match_priority_age INTEGER NOT NULL DEFAULT 1,
  match_priority_weight INTEGER NOT NULL DEFAULT 2,
  match_priority_experience INTEGER NOT NULL DEFAULT 3,
  match_priority_skill INTEGER NOT NULL DEFAULT 4,
  
  -- Matching constraints
  max_age_diff INTEGER NOT NULL DEFAULT 1,
  max_matches_per_wrestler INTEGER NOT NULL DEFAULT 4,
  teammates_can_wrestle BOOLEAN NOT NULL DEFAULT false,
  conflict_min_gap INTEGER NOT NULL DEFAULT 7,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meet_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only host team manager can manage meet rules
CREATE POLICY "Host team can view meet rules"
  ON public.meet_rules
  FOR SELECT
  USING (
    meet_id IN (
      SELECT id FROM public.meets
      WHERE host_team_id IN (
        SELECT id FROM public.teams WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Host team can create meet rules"
  ON public.meet_rules
  FOR INSERT
  WITH CHECK (
    meet_id IN (
      SELECT id FROM public.meets
      WHERE host_team_id IN (
        SELECT id FROM public.teams WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Host team can update meet rules"
  ON public.meet_rules
  FOR UPDATE
  USING (
    meet_id IN (
      SELECT id FROM public.meets
      WHERE host_team_id IN (
        SELECT id FROM public.teams WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Host team can delete meet rules"
  ON public.meet_rules
  FOR DELETE
  USING (
    meet_id IN (
      SELECT id FROM public.meets
      WHERE host_team_id IN (
        SELECT id FROM public.teams WHERE user_id = auth.uid()
      )
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_meet_rules_updated_at
  BEFORE UPDATE ON public.meet_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();