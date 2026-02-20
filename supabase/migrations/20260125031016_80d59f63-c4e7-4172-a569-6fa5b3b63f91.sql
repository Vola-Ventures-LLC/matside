-- Add team configuration columns
ALTER TABLE public.teams
ADD COLUMN home_meet_address text,
ADD COLUMN home_meet_notes text,
ADD COLUMN match_priority_age integer NOT NULL DEFAULT 1,
ADD COLUMN match_priority_weight integer NOT NULL DEFAULT 2,
ADD COLUMN match_priority_experience integer NOT NULL DEFAULT 3,
ADD COLUMN match_priority_skill integer NOT NULL DEFAULT 4,
ADD COLUMN max_age_diff integer NOT NULL DEFAULT 1,
ADD COLUMN max_matches_per_wrestler integer NOT NULL DEFAULT 4,
ADD COLUMN teammates_can_wrestle boolean NOT NULL DEFAULT false,
ADD COLUMN conflict_min_matches integer NOT NULL DEFAULT 2,
ADD COLUMN conflict_max_matches integer NOT NULL DEFAULT 5,
ADD COLUMN conflict_min_gap integer NOT NULL DEFAULT 7;

-- Create mat_rules table for team-specific mat configurations
CREATE TABLE public.mat_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  mat_number integer NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  min_experience integer NOT NULL DEFAULT 0,
  max_experience integer NOT NULL DEFAULT 5,
  min_age integer NOT NULL DEFAULT 4,
  max_age integer NOT NULL DEFAULT 18,
  max_matches integer NOT NULL DEFAULT 20,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(team_id, mat_number),
  CONSTRAINT mat_number_range CHECK (mat_number >= 1 AND mat_number <= 10),
  CONSTRAINT experience_range CHECK (min_experience >= 0 AND max_experience <= 5 AND min_experience <= max_experience),
  CONSTRAINT age_range CHECK (min_age >= 4 AND max_age <= 99 AND min_age <= max_age)
);

-- Enable RLS on mat_rules
ALTER TABLE public.mat_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies for mat_rules
CREATE POLICY "Users can view mat rules for their teams"
ON public.mat_rules
FOR SELECT
USING (team_id IN (SELECT id FROM teams WHERE user_id = auth.uid()));

CREATE POLICY "Users can create mat rules for their teams"
ON public.mat_rules
FOR INSERT
WITH CHECK (team_id IN (SELECT id FROM teams WHERE user_id = auth.uid()));

CREATE POLICY "Users can update mat rules for their teams"
ON public.mat_rules
FOR UPDATE
USING (team_id IN (SELECT id FROM teams WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete mat rules for their teams"
ON public.mat_rules
FOR DELETE
USING (team_id IN (SELECT id FROM teams WHERE user_id = auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_mat_rules_updated_at
BEFORE UPDATE ON public.mat_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();