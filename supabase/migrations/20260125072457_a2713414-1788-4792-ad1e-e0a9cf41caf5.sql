-- Create meet_mat_rules table for meet-specific mat configurations
CREATE TABLE public.meet_mat_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meet_id UUID NOT NULL REFERENCES public.meets(id) ON DELETE CASCADE,
  mat_number INTEGER NOT NULL,
  min_experience INTEGER NOT NULL DEFAULT 0,
  max_experience INTEGER NOT NULL DEFAULT 5,
  min_age INTEGER NOT NULL DEFAULT 4,
  max_age INTEGER NOT NULL DEFAULT 18,
  max_matches INTEGER NOT NULL DEFAULT 99,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meet_id, mat_number)
);

-- Enable RLS
ALTER TABLE public.meet_mat_rules ENABLE ROW LEVEL SECURITY;

-- Create policies - only host team can manage
CREATE POLICY "Host team can view meet mat rules"
ON public.meet_mat_rules
FOR SELECT
USING (
  meet_id IN (
    SELECT m.id FROM meets m
    WHERE m.host_team_id IN (
      SELECT t.id FROM teams t WHERE t.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Host team can create meet mat rules"
ON public.meet_mat_rules
FOR INSERT
WITH CHECK (
  meet_id IN (
    SELECT m.id FROM meets m
    WHERE m.host_team_id IN (
      SELECT t.id FROM teams t WHERE t.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Host team can update meet mat rules"
ON public.meet_mat_rules
FOR UPDATE
USING (
  meet_id IN (
    SELECT m.id FROM meets m
    WHERE m.host_team_id IN (
      SELECT t.id FROM teams t WHERE t.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Host team can delete meet mat rules"
ON public.meet_mat_rules
FOR DELETE
USING (
  meet_id IN (
    SELECT m.id FROM meets m
    WHERE m.host_team_id IN (
      SELECT t.id FROM teams t WHERE t.user_id = auth.uid()
    )
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_meet_mat_rules_updated_at
BEFORE UPDATE ON public.meet_mat_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();