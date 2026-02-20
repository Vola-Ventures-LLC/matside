-- Add last_weigh_in_date to wrestlers table
ALTER TABLE public.wrestlers 
ADD COLUMN last_weigh_in_date date;

-- Create audit table for wrestler changes
CREATE TABLE public.wrestler_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wrestler_id uuid NOT NULL REFERENCES public.wrestlers(id) ON DELETE CASCADE,
  team_id uuid NOT NULL,
  changed_by uuid NOT NULL,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wrestler_changes ENABLE ROW LEVEL SECURITY;

-- Team managers can view changes for their wrestlers
CREATE POLICY "Team managers can view wrestler changes"
ON public.wrestler_changes
FOR SELECT
USING (team_id IN (
  SELECT id FROM public.teams WHERE user_id = auth.uid()
));

-- Team managers can insert changes for their wrestlers
CREATE POLICY "Team managers can insert wrestler changes"
ON public.wrestler_changes
FOR INSERT
WITH CHECK (team_id IN (
  SELECT id FROM public.teams WHERE user_id = auth.uid()
));

-- Create index for faster lookups
CREATE INDEX idx_wrestler_changes_wrestler_id ON public.wrestler_changes(wrestler_id);
CREATE INDEX idx_wrestler_changes_created_at ON public.wrestler_changes(created_at DESC);