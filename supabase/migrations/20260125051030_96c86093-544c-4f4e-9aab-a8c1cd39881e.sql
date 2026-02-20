-- Create meet_attendance table to track wrestler attendance status for meets
CREATE TABLE public.meet_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meet_id UUID NOT NULL REFERENCES public.meets(id) ON DELETE CASCADE,
  wrestler_id UUID NOT NULL REFERENCES public.wrestlers(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'attending', 'not_attending', 'arriving_late', 'leaving_early')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meet_id, wrestler_id)
);

-- Enable Row Level Security
ALTER TABLE public.meet_attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for meet_attendance
CREATE POLICY "Team managers can view attendance for their team"
ON public.meet_attendance
FOR SELECT
USING (team_id IN (SELECT id FROM teams WHERE user_id = auth.uid()));

CREATE POLICY "Team managers can insert attendance for their team"
ON public.meet_attendance
FOR INSERT
WITH CHECK (team_id IN (SELECT id FROM teams WHERE user_id = auth.uid()));

CREATE POLICY "Team managers can update attendance for their team"
ON public.meet_attendance
FOR UPDATE
USING (team_id IN (SELECT id FROM teams WHERE user_id = auth.uid()));

CREATE POLICY "Team managers can delete attendance for their team"
ON public.meet_attendance
FOR DELETE
USING (team_id IN (SELECT id FROM teams WHERE user_id = auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_meet_attendance_updated_at
BEFORE UPDATE ON public.meet_attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();