-- Update RLS policies on 'teams' table to use is_team_manager
DROP POLICY IF EXISTS "Users can view their own teams" ON public.teams;
DROP POLICY IF EXISTS "Users can update their own teams" ON public.teams;
DROP POLICY IF EXISTS "Users can delete their own teams" ON public.teams;

-- View: managers can see their teams
CREATE POLICY "Team managers can view their teams"
ON public.teams
FOR SELECT
USING (is_team_manager(auth.uid(), id));

-- Update: only owners can update team settings
CREATE POLICY "Team owners can update their teams"
ON public.teams
FOR UPDATE
USING (is_team_owner(auth.uid(), id));

-- Delete: only owners can delete teams
CREATE POLICY "Team owners can delete their teams"
ON public.teams
FOR DELETE
USING (is_team_owner(auth.uid(), id));

-- Update RLS policies on 'wrestlers' table
DROP POLICY IF EXISTS "Users can view wrestlers on their teams" ON public.wrestlers;
DROP POLICY IF EXISTS "Users can create wrestlers on their teams" ON public.wrestlers;
DROP POLICY IF EXISTS "Users can update wrestlers on their teams" ON public.wrestlers;
DROP POLICY IF EXISTS "Users can delete wrestlers on their teams" ON public.wrestlers;

CREATE POLICY "Team managers can view wrestlers"
ON public.wrestlers
FOR SELECT
USING (is_team_manager(auth.uid(), team_id));

CREATE POLICY "Team managers can create wrestlers"
ON public.wrestlers
FOR INSERT
WITH CHECK (is_team_manager(auth.uid(), team_id));

CREATE POLICY "Team managers can update wrestlers"
ON public.wrestlers
FOR UPDATE
USING (is_team_manager(auth.uid(), team_id));

CREATE POLICY "Team managers can delete wrestlers"
ON public.wrestlers
FOR DELETE
USING (is_team_manager(auth.uid(), team_id));

-- Update RLS policies on 'mat_rules' table
DROP POLICY IF EXISTS "Users can view mat rules for their teams" ON public.mat_rules;
DROP POLICY IF EXISTS "Users can create mat rules for their teams" ON public.mat_rules;
DROP POLICY IF EXISTS "Users can update mat rules for their teams" ON public.mat_rules;
DROP POLICY IF EXISTS "Users can delete mat rules for their teams" ON public.mat_rules;

CREATE POLICY "Team managers can view mat rules"
ON public.mat_rules
FOR SELECT
USING (is_team_manager(auth.uid(), team_id));

CREATE POLICY "Team managers can create mat rules"
ON public.mat_rules
FOR INSERT
WITH CHECK (is_team_manager(auth.uid(), team_id));

CREATE POLICY "Team managers can update mat rules"
ON public.mat_rules
FOR UPDATE
USING (is_team_manager(auth.uid(), team_id));

CREATE POLICY "Team managers can delete mat rules"
ON public.mat_rules
FOR DELETE
USING (is_team_manager(auth.uid(), team_id));

-- Update RLS policies on 'meet_attendance' table
DROP POLICY IF EXISTS "Team managers can view attendance for their team" ON public.meet_attendance;
DROP POLICY IF EXISTS "Team managers can insert attendance for their team" ON public.meet_attendance;
DROP POLICY IF EXISTS "Team managers can update attendance for their team" ON public.meet_attendance;
DROP POLICY IF EXISTS "Team managers can delete attendance for their team" ON public.meet_attendance;

CREATE POLICY "Team managers can view their team attendance"
ON public.meet_attendance
FOR SELECT
USING (is_team_manager(auth.uid(), team_id));

CREATE POLICY "Team managers can insert their team attendance"
ON public.meet_attendance
FOR INSERT
WITH CHECK (is_team_manager(auth.uid(), team_id));

CREATE POLICY "Team managers can update their team attendance"
ON public.meet_attendance
FOR UPDATE
USING (is_team_manager(auth.uid(), team_id));

CREATE POLICY "Team managers can delete their team attendance"
ON public.meet_attendance
FOR DELETE
USING (is_team_manager(auth.uid(), team_id));

-- Update RLS policies on 'wrestler_changes' table
DROP POLICY IF EXISTS "Team managers can view wrestler changes" ON public.wrestler_changes;
DROP POLICY IF EXISTS "Team managers can insert wrestler changes" ON public.wrestler_changes;

CREATE POLICY "Team managers can view their wrestler changes"
ON public.wrestler_changes
FOR SELECT
USING (is_team_manager(auth.uid(), team_id));

CREATE POLICY "Team managers can insert their wrestler changes"
ON public.wrestler_changes
FOR INSERT
WITH CHECK (is_team_manager(auth.uid(), team_id));

-- Update RLS policies on 'wrestler_flags' table
DROP POLICY IF EXISTS "Teams can flag their own wrestlers" ON public.wrestler_flags;
DROP POLICY IF EXISTS "Teams can update their own flags" ON public.wrestler_flags;
DROP POLICY IF EXISTS "Teams can delete their own flags" ON public.wrestler_flags;

CREATE POLICY "Team managers can flag wrestlers"
ON public.wrestler_flags
FOR INSERT
WITH CHECK (is_team_manager(auth.uid(), team_id));

CREATE POLICY "Team managers can update their flags"
ON public.wrestler_flags
FOR UPDATE
USING (is_team_manager(auth.uid(), team_id));

CREATE POLICY "Team managers can delete their flags"
ON public.wrestler_flags
FOR DELETE
USING (is_team_manager(auth.uid(), team_id));