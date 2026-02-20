-- Allow host team managers to view wrestlers from teams participating in their meets
CREATE POLICY "Host team can view participating team wrestlers"
ON public.wrestlers
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.meets m
    JOIN public.teams host_team ON host_team.id = m.host_team_id
    JOIN public.meet_teams mt ON mt.meet_id = m.id
    WHERE host_team.user_id = auth.uid()
      AND mt.team_id = wrestlers.team_id
  )
);