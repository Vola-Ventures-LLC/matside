-- Create enum for pairing status
CREATE TYPE public.pairing_status AS ENUM ('draft', 'planned', 'published');

-- Add pairing_status column to meets table
ALTER TABLE public.meets 
ADD COLUMN pairing_status public.pairing_status NOT NULL DEFAULT 'draft';

-- Create pairing_audit table to track all changes after 'planned' status
CREATE TABLE public.pairing_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meet_id UUID NOT NULL REFERENCES public.meets(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  wrestler_id UUID REFERENCES public.wrestlers(id) ON DELETE SET NULL,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  changed_by UUID NOT NULL,
  action TEXT NOT NULL, -- 'scratch', 'match_changed', 'match_added', 'match_removed', 'approved', 'rejected'
  old_value JSONB,
  new_value JSONB,
  description TEXT NOT NULL, -- Human-readable description
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scratch_suggestions table for pending replacement pairings
CREATE TABLE public.scratch_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meet_id UUID NOT NULL REFERENCES public.meets(id) ON DELETE CASCADE,
  original_match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  scratched_wrestler_id UUID NOT NULL REFERENCES public.wrestlers(id) ON DELETE CASCADE,
  remaining_wrestler_id UUID NOT NULL REFERENCES public.wrestlers(id) ON DELETE CASCADE,
  suggested_opponent_id UUID REFERENCES public.wrestlers(id) ON DELETE SET NULL,
  suggested_by UUID NOT NULL, -- The manager who scratched
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create public_meet_tokens table for shareable public links
CREATE TABLE public.public_meet_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meet_id UUID NOT NULL REFERENCES public.meets(id) ON DELETE CASCADE UNIQUE,
  token TEXT NOT NULL UNIQUE DEFAULT substring(replace(gen_random_uuid()::text, '-', ''), 1, 16),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE -- NULL means never expires
);

-- Enable RLS on all new tables
ALTER TABLE public.pairing_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scratch_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_meet_tokens ENABLE ROW LEVEL SECURITY;

-- Pairing Audit RLS Policies
-- Team managers can view audit entries for their team
CREATE POLICY "Team managers can view their team audit" 
ON public.pairing_audit FOR SELECT 
USING (is_team_manager(auth.uid(), team_id));

-- Host managers can view all audit entries for their meets
CREATE POLICY "Host managers can view all audit" 
ON public.pairing_audit FOR SELECT 
USING (meet_id IN (
  SELECT id FROM meets WHERE is_team_manager(auth.uid(), host_team_id)
));

-- Team managers can insert audit entries for their team
CREATE POLICY "Team managers can insert audit" 
ON public.pairing_audit FOR INSERT 
WITH CHECK (is_team_manager(auth.uid(), team_id) AND changed_by = auth.uid());

-- Host managers can insert audit entries
CREATE POLICY "Host managers can insert audit" 
ON public.pairing_audit FOR INSERT 
WITH CHECK (meet_id IN (
  SELECT id FROM meets WHERE is_team_manager(auth.uid(), host_team_id)
) AND changed_by = auth.uid());

-- Scratch Suggestions RLS Policies
-- Team managers can view suggestions involving their team's wrestlers
CREATE POLICY "Team managers can view suggestions for their wrestlers" 
ON public.scratch_suggestions FOR SELECT 
USING (
  scratched_wrestler_id IN (SELECT id FROM wrestlers WHERE is_team_manager(auth.uid(), team_id))
  OR remaining_wrestler_id IN (SELECT id FROM wrestlers WHERE is_team_manager(auth.uid(), team_id))
);

-- Host managers can view all suggestions for their meets
CREATE POLICY "Host managers can view all suggestions" 
ON public.scratch_suggestions FOR SELECT 
USING (meet_id IN (
  SELECT id FROM meets WHERE is_team_manager(auth.uid(), host_team_id)
));

-- Team managers can create scratch suggestions for their wrestlers
CREATE POLICY "Team managers can create scratch suggestions" 
ON public.scratch_suggestions FOR INSERT 
WITH CHECK (
  scratched_wrestler_id IN (SELECT id FROM wrestlers WHERE is_team_manager(auth.uid(), team_id))
  AND suggested_by = auth.uid()
);

-- Host managers can update suggestions (approve/reject)
CREATE POLICY "Host managers can update suggestions" 
ON public.scratch_suggestions FOR UPDATE 
USING (meet_id IN (
  SELECT id FROM meets WHERE is_team_manager(auth.uid(), host_team_id)
));

-- Public Meet Tokens RLS Policies
-- Host managers can manage tokens for their meets
CREATE POLICY "Host managers can view tokens" 
ON public.public_meet_tokens FOR SELECT 
USING (meet_id IN (
  SELECT id FROM meets WHERE is_team_manager(auth.uid(), host_team_id)
));

CREATE POLICY "Host managers can create tokens" 
ON public.public_meet_tokens FOR INSERT 
WITH CHECK (
  meet_id IN (SELECT id FROM meets WHERE is_team_manager(auth.uid(), host_team_id))
  AND created_by = auth.uid()
);

CREATE POLICY "Host managers can delete tokens" 
ON public.public_meet_tokens FOR DELETE 
USING (meet_id IN (
  SELECT id FROM meets WHERE is_team_manager(auth.uid(), host_team_id)
));

-- Add updated_at trigger to scratch_suggestions
CREATE TRIGGER update_scratch_suggestions_updated_at
BEFORE UPDATE ON public.scratch_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();