-- Allow participating team managers to view wrestlers in matches for meets they're participating in
CREATE POLICY "Participating team managers can view wrestlers in matches"
ON public.wrestlers
AS PERMISSIVE
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM matches m
    JOIN meets meet ON meet.id = m.meet_id
    JOIN meet_teams mt ON mt.meet_id = meet.id
    WHERE is_team_manager(auth.uid(), mt.team_id)
    AND (m.wrestler_a_id = wrestlers.id OR m.wrestler_b_id = wrestlers.id)
  )
);