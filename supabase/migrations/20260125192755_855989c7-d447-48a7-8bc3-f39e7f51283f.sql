-- Update helper function shares_meet_with_team to use is_team_manager
CREATE OR REPLACE FUNCTION public.shares_meet_with_team(_team_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- User's teams (via team_members)
    SELECT 1
    FROM public.meet_teams mt1
    JOIN public.team_members tm ON tm.team_id = mt1.team_id AND tm.user_id = _user_id AND tm.status = 'active'
    JOIN public.meet_teams mt2 ON mt2.meet_id = mt1.meet_id
    WHERE mt2.team_id = _team_id
  )
  OR EXISTS (
    -- User is host of a meet where the team is participating
    SELECT 1
    FROM public.meets m
    JOIN public.team_members tm ON tm.team_id = m.host_team_id AND tm.user_id = _user_id AND tm.status = 'active'
    JOIN public.meet_teams mt ON mt.meet_id = m.id
    WHERE mt.team_id = _team_id
  )
  OR EXISTS (
    -- Team is host of a meet where user's team is participating
    SELECT 1
    FROM public.meets m
    WHERE m.host_team_id = _team_id
    AND EXISTS (
      SELECT 1 
      FROM public.meet_teams mt
      JOIN public.team_members tm ON tm.team_id = mt.team_id AND tm.user_id = _user_id AND tm.status = 'active'
      WHERE mt.meet_id = m.id
    )
  )
$$;

-- Update is_user_team_in_meet to use team_members
CREATE OR REPLACE FUNCTION public.is_user_team_in_meet(_meet_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.meet_teams mt
    JOIN public.team_members tm ON tm.team_id = mt.team_id AND tm.user_id = _user_id AND tm.status = 'active'
    WHERE mt.meet_id = _meet_id
  )
$$;

-- Update is_team_in_user_league to use team_members for team check
CREATE OR REPLACE FUNCTION public.is_team_in_user_league(_team_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.league_teams lt
    JOIN public.league_members lm ON lm.league_id = lt.league_id
    WHERE lt.team_id = _team_id
      AND lm.user_id = _user_id
  )
$$;

-- Update RLS policies on 'meets' table
DROP POLICY IF EXISTS "Users can create meets" ON public.meets;
DROP POLICY IF EXISTS "Users can update meets" ON public.meets;
DROP POLICY IF EXISTS "Users can delete meets" ON public.meets;
DROP POLICY IF EXISTS "Users can view their meets" ON public.meets;

CREATE POLICY "Team managers can create meets"
ON public.meets
FOR INSERT
WITH CHECK (
  is_team_manager(auth.uid(), host_team_id)
  OR (league_id IS NOT NULL AND is_league_organizer(auth.uid(), league_id))
);

CREATE POLICY "Team managers can update meets"
ON public.meets
FOR UPDATE
USING (
  is_team_manager(auth.uid(), host_team_id)
  OR (league_id IS NOT NULL AND is_league_organizer(auth.uid(), league_id))
);

CREATE POLICY "Team managers can delete meets"
ON public.meets
FOR DELETE
USING (
  is_team_manager(auth.uid(), host_team_id)
  OR (league_id IS NOT NULL AND is_league_organizer(auth.uid(), league_id))
);

CREATE POLICY "Team managers can view meets"
ON public.meets
FOR SELECT
USING (
  is_team_manager(auth.uid(), host_team_id)
  OR (league_id IS NOT NULL AND is_league_member(auth.uid(), league_id))
  OR is_user_team_in_meet(id, auth.uid())
);

-- Update RLS policies on 'matches' table
DROP POLICY IF EXISTS "Users can view matches for their meets" ON public.matches;
DROP POLICY IF EXISTS "Users can manage matches for their meets" ON public.matches;
DROP POLICY IF EXISTS "Users can update matches for their meets" ON public.matches;
DROP POLICY IF EXISTS "Users can delete matches for their meets" ON public.matches;

CREATE POLICY "Host team managers can view matches"
ON public.matches
FOR SELECT
USING (
  meet_id IN (
    SELECT id FROM public.meets
    WHERE is_team_manager(auth.uid(), host_team_id)
  )
);

CREATE POLICY "Host team managers can create matches"
ON public.matches
FOR INSERT
WITH CHECK (
  meet_id IN (
    SELECT id FROM public.meets
    WHERE is_team_manager(auth.uid(), host_team_id)
  )
);

CREATE POLICY "Host team managers can update matches"
ON public.matches
FOR UPDATE
USING (
  meet_id IN (
    SELECT id FROM public.meets
    WHERE is_team_manager(auth.uid(), host_team_id)
  )
);

CREATE POLICY "Host team managers can delete matches"
ON public.matches
FOR DELETE
USING (
  meet_id IN (
    SELECT id FROM public.meets
    WHERE is_team_manager(auth.uid(), host_team_id)
  )
);

-- Update RLS on meet_rules, meet_mat_rules, meet_registrations
DROP POLICY IF EXISTS "Host team can view meet rules" ON public.meet_rules;
DROP POLICY IF EXISTS "Host team can create meet rules" ON public.meet_rules;
DROP POLICY IF EXISTS "Host team can update meet rules" ON public.meet_rules;
DROP POLICY IF EXISTS "Host team can delete meet rules" ON public.meet_rules;

CREATE POLICY "Host managers can view meet rules"
ON public.meet_rules FOR SELECT
USING (meet_id IN (SELECT id FROM meets WHERE is_team_manager(auth.uid(), host_team_id)));

CREATE POLICY "Host managers can create meet rules"
ON public.meet_rules FOR INSERT
WITH CHECK (meet_id IN (SELECT id FROM meets WHERE is_team_manager(auth.uid(), host_team_id)));

CREATE POLICY "Host managers can update meet rules"
ON public.meet_rules FOR UPDATE
USING (meet_id IN (SELECT id FROM meets WHERE is_team_manager(auth.uid(), host_team_id)));

CREATE POLICY "Host managers can delete meet rules"
ON public.meet_rules FOR DELETE
USING (meet_id IN (SELECT id FROM meets WHERE is_team_manager(auth.uid(), host_team_id)));

DROP POLICY IF EXISTS "Host team can view meet mat rules" ON public.meet_mat_rules;
DROP POLICY IF EXISTS "Host team can create meet mat rules" ON public.meet_mat_rules;
DROP POLICY IF EXISTS "Host team can update meet mat rules" ON public.meet_mat_rules;
DROP POLICY IF EXISTS "Host team can delete meet mat rules" ON public.meet_mat_rules;

CREATE POLICY "Host managers can view meet mat rules"
ON public.meet_mat_rules FOR SELECT
USING (meet_id IN (SELECT id FROM meets WHERE is_team_manager(auth.uid(), host_team_id)));

CREATE POLICY "Host managers can create meet mat rules"
ON public.meet_mat_rules FOR INSERT
WITH CHECK (meet_id IN (SELECT id FROM meets WHERE is_team_manager(auth.uid(), host_team_id)));

CREATE POLICY "Host managers can update meet mat rules"
ON public.meet_mat_rules FOR UPDATE
USING (meet_id IN (SELECT id FROM meets WHERE is_team_manager(auth.uid(), host_team_id)));

CREATE POLICY "Host managers can delete meet mat rules"
ON public.meet_mat_rules FOR DELETE
USING (meet_id IN (SELECT id FROM meets WHERE is_team_manager(auth.uid(), host_team_id)));

DROP POLICY IF EXISTS "Users can view registrations for their meets" ON public.meet_registrations;
DROP POLICY IF EXISTS "Users can manage registrations for their meets" ON public.meet_registrations;
DROP POLICY IF EXISTS "Users can update registrations for their meets" ON public.meet_registrations;
DROP POLICY IF EXISTS "Users can delete registrations for their meets" ON public.meet_registrations;

CREATE POLICY "Host managers can view registrations"
ON public.meet_registrations FOR SELECT
USING (meet_id IN (SELECT id FROM meets WHERE is_team_manager(auth.uid(), host_team_id)));

CREATE POLICY "Host managers can create registrations"
ON public.meet_registrations FOR INSERT
WITH CHECK (meet_id IN (SELECT id FROM meets WHERE is_team_manager(auth.uid(), host_team_id)));

CREATE POLICY "Host managers can update registrations"
ON public.meet_registrations FOR UPDATE
USING (meet_id IN (SELECT id FROM meets WHERE is_team_manager(auth.uid(), host_team_id)));

CREATE POLICY "Host managers can delete registrations"
ON public.meet_registrations FOR DELETE
USING (meet_id IN (SELECT id FROM meets WHERE is_team_manager(auth.uid(), host_team_id)));