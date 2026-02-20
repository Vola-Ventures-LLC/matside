-- Add league_id to meets table for league-organized meets
ALTER TABLE public.meets
ADD COLUMN league_id uuid REFERENCES public.leagues(id) ON DELETE SET NULL;

-- Create index for league meets queries
CREATE INDEX idx_meets_league_id ON public.meets(league_id);

-- Create table for tracking which teams are invited/participating in a meet
CREATE TABLE public.meet_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meet_id uuid NOT NULL REFERENCES public.meets(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'confirmed', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(meet_id, team_id)
);

-- Enable RLS
ALTER TABLE public.meet_teams ENABLE ROW LEVEL SECURITY;

-- RLS policies for meet_teams
-- League members can view meet teams for league meets
CREATE POLICY "League members can view meet teams"
ON public.meet_teams
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  meet_id IN (
    SELECT id FROM meets WHERE league_id IN (
      SELECT league_id FROM league_members WHERE user_id = auth.uid()
    )
  )
  OR
  meet_id IN (
    SELECT id FROM meets WHERE host_team_id IN (
      SELECT id FROM teams WHERE user_id = auth.uid()
    )
  )
  OR
  team_id IN (SELECT id FROM teams WHERE user_id = auth.uid())
);

-- League organizers can manage meet teams for their league meets
CREATE POLICY "League organizers can insert meet teams"
ON public.meet_teams
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  meet_id IN (
    SELECT id FROM meets WHERE league_id IN (
      SELECT league_id FROM league_members WHERE user_id = auth.uid() AND role = 'organizer'
    )
  )
  OR
  meet_id IN (
    SELECT id FROM meets WHERE host_team_id IN (
      SELECT id FROM teams WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "League organizers can update meet teams"
ON public.meet_teams
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  meet_id IN (
    SELECT id FROM meets WHERE league_id IN (
      SELECT league_id FROM league_members WHERE user_id = auth.uid() AND role = 'organizer'
    )
  )
  OR
  meet_id IN (
    SELECT id FROM meets WHERE host_team_id IN (
      SELECT id FROM teams WHERE user_id = auth.uid()
    )
  )
  OR
  team_id IN (SELECT id FROM teams WHERE user_id = auth.uid())
);

CREATE POLICY "League organizers can delete meet teams"
ON public.meet_teams
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  meet_id IN (
    SELECT id FROM meets WHERE league_id IN (
      SELECT league_id FROM league_members WHERE user_id = auth.uid() AND role = 'organizer'
    )
  )
  OR
  meet_id IN (
    SELECT id FROM meets WHERE host_team_id IN (
      SELECT id FROM teams WHERE user_id = auth.uid()
    )
  )
);

-- Update meets RLS to allow league organizers to manage league meets
DROP POLICY IF EXISTS "Users can view meets they host" ON public.meets;
DROP POLICY IF EXISTS "Users can create meets for their teams" ON public.meets;
DROP POLICY IF EXISTS "Users can update meets they host" ON public.meets;
DROP POLICY IF EXISTS "Users can delete meets they host" ON public.meets;

-- SELECT: Host teams OR league members can view
CREATE POLICY "Users can view their meets"
ON public.meets
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  host_team_id IN (SELECT id FROM teams WHERE user_id = auth.uid())
  OR
  (league_id IS NOT NULL AND is_league_member(auth.uid(), league_id))
);

-- INSERT: Host teams OR league organizers can create
CREATE POLICY "Users can create meets"
ON public.meets
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  host_team_id IN (SELECT id FROM teams WHERE user_id = auth.uid())
  OR
  (league_id IS NOT NULL AND is_league_organizer(auth.uid(), league_id))
);

-- UPDATE: Host teams OR league organizers can update
CREATE POLICY "Users can update meets"
ON public.meets
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  host_team_id IN (SELECT id FROM teams WHERE user_id = auth.uid())
  OR
  (league_id IS NOT NULL AND is_league_organizer(auth.uid(), league_id))
);

-- DELETE: Host teams OR league organizers can delete
CREATE POLICY "Users can delete meets"
ON public.meets
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  host_team_id IN (SELECT id FROM teams WHERE user_id = auth.uid())
  OR
  (league_id IS NOT NULL AND is_league_organizer(auth.uid(), league_id))
);