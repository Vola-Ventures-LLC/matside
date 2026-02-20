-- Update league_teams policies to use team_members
DROP POLICY IF EXISTS "Team managers can view their team league memberships" ON public.league_teams;
DROP POLICY IF EXISTS "Team managers can update their team league status" ON public.league_teams;
DROP POLICY IF EXISTS "Team managers can remove their team from leagues" ON public.league_teams;
DROP POLICY IF EXISTS "Teams can join leagues or organizers can add" ON public.league_teams;

CREATE POLICY "Team managers can view their league memberships"
ON public.league_teams
FOR SELECT
USING (is_team_manager(auth.uid(), team_id));

CREATE POLICY "Team managers can update their league status"
ON public.league_teams
FOR UPDATE
USING (is_team_manager(auth.uid(), team_id));

CREATE POLICY "Team managers can remove from leagues"
ON public.league_teams
FOR DELETE
USING (is_team_manager(auth.uid(), team_id));

CREATE POLICY "Team managers can join leagues"
ON public.league_teams
FOR INSERT
WITH CHECK (
  is_team_manager(auth.uid(), team_id)
  OR is_league_organizer(auth.uid(), league_id)
);

-- Update meet_teams policies to use team_members
DROP POLICY IF EXISTS "League members can view meet teams" ON public.meet_teams;
DROP POLICY IF EXISTS "League organizers can insert meet teams" ON public.meet_teams;
DROP POLICY IF EXISTS "League organizers can update meet teams" ON public.meet_teams;
DROP POLICY IF EXISTS "League organizers can delete meet teams" ON public.meet_teams;

CREATE POLICY "Team managers can view meet teams"
ON public.meet_teams
FOR SELECT
USING (
  meet_id IN (SELECT id FROM meets WHERE league_id IN (SELECT league_id FROM league_members WHERE user_id = auth.uid()))
  OR meet_id IN (SELECT id FROM meets WHERE is_team_manager(auth.uid(), host_team_id))
  OR is_team_manager(auth.uid(), team_id)
);

CREATE POLICY "Host managers or organizers can insert meet teams"
ON public.meet_teams
FOR INSERT
WITH CHECK (
  meet_id IN (SELECT id FROM meets WHERE league_id IN (SELECT league_id FROM league_members WHERE user_id = auth.uid() AND role = 'organizer'))
  OR meet_id IN (SELECT id FROM meets WHERE is_team_manager(auth.uid(), host_team_id))
);

CREATE POLICY "Host managers or organizers or team can update meet teams"
ON public.meet_teams
FOR UPDATE
USING (
  meet_id IN (SELECT id FROM meets WHERE league_id IN (SELECT league_id FROM league_members WHERE user_id = auth.uid() AND role = 'organizer'))
  OR meet_id IN (SELECT id FROM meets WHERE is_team_manager(auth.uid(), host_team_id))
  OR is_team_manager(auth.uid(), team_id)
);

CREATE POLICY "Host managers or organizers can delete meet teams"
ON public.meet_teams
FOR DELETE
USING (
  meet_id IN (SELECT id FROM meets WHERE league_id IN (SELECT league_id FROM league_members WHERE user_id = auth.uid() AND role = 'organizer'))
  OR meet_id IN (SELECT id FROM meets WHERE is_team_manager(auth.uid(), host_team_id))
);

-- Update host team can view attendance policy
DROP POLICY IF EXISTS "Host team can view participating team attendance" ON public.meet_attendance;

CREATE POLICY "Host managers can view participating team attendance"
ON public.meet_attendance
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM meets m
    WHERE m.id = meet_attendance.meet_id
      AND is_team_manager(auth.uid(), m.host_team_id)
  )
);

-- Update wrestler visibility policies for host team
DROP POLICY IF EXISTS "Host team can view consented participating team wrestlers" ON public.wrestlers;
DROP POLICY IF EXISTS "Host team can view wrestlers in their meet matches" ON public.wrestlers;

CREATE POLICY "Host managers can view consented participating wrestlers"
ON public.wrestlers
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM meets m
    JOIN meet_teams mt ON mt.meet_id = m.id
    JOIN teams participating_team ON participating_team.id = mt.team_id
    WHERE is_team_manager(auth.uid(), m.host_team_id)
      AND mt.team_id = wrestlers.team_id
      AND mt.status = 'confirmed'
      AND participating_team.data_sharing_consent = true
  )
);

CREATE POLICY "Host managers can view wrestlers in matches"
ON public.wrestlers
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM matches match
    JOIN meets meet ON meet.id = match.meet_id
    WHERE is_team_manager(auth.uid(), meet.host_team_id)
      AND (match.wrestler_a_id = wrestlers.id OR match.wrestler_b_id = wrestlers.id)
  )
);