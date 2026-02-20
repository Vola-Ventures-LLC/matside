-- Allow host team managers to view attendance from teams participating in their meets
CREATE POLICY "Host team can view participating team attendance"
ON public.meet_attendance
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.meets m
    JOIN public.teams host_team ON host_team.id = m.host_team_id
    WHERE host_team.user_id = auth.uid()
      AND m.id = meet_attendance.meet_id
  )
);