-- Allow participating team managers to view attendance from other teams in the same meet
CREATE POLICY "Participating team managers can view meet attendance"
ON public.meet_attendance
AS PERMISSIVE
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM meet_teams mt
    WHERE mt.meet_id = meet_attendance.meet_id
    AND is_team_manager(auth.uid(), mt.team_id)
  )
);