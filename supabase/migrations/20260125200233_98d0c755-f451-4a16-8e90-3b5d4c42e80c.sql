-- Create consent audit log table
CREATE TABLE public.consent_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('enabled', 'disabled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consent_audit ENABLE ROW LEVEL SECURITY;

-- Team managers can view their consent audit logs
CREATE POLICY "Team managers can view consent audit"
  ON public.consent_audit
  FOR SELECT
  USING (is_team_manager(auth.uid(), team_id));

-- Team managers can insert consent audit logs
CREATE POLICY "Team managers can insert consent audit"
  ON public.consent_audit
  FOR INSERT
  WITH CHECK (is_team_manager(auth.uid(), team_id));

-- Add index for efficient querying
CREATE INDEX idx_consent_audit_team_id ON public.consent_audit(team_id);
CREATE INDEX idx_consent_audit_created_at ON public.consent_audit(created_at DESC);