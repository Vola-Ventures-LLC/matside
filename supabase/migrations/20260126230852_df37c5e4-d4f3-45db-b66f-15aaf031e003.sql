-- Allow anyone to look up a public meet token (for the public view)
CREATE POLICY "Anyone can lookup public tokens"
ON public.public_meet_tokens FOR SELECT
USING (true);

-- Allow anyone to view meets that have been published with a public token
CREATE POLICY "Anyone can view published meets"
ON public.meets FOR SELECT
USING (
  id IN (SELECT meet_id FROM public_meet_tokens)
);

-- Allow anyone to view matches for published meets
CREATE POLICY "Anyone can view matches in published meets"
ON public.matches FOR SELECT
USING (
  meet_id IN (SELECT meet_id FROM public_meet_tokens)
);

-- Allow anyone to view wrestler basic info for matches in published meets
CREATE POLICY "Anyone can view wrestlers in published meets"
ON public.wrestlers FOR SELECT
USING (
  id IN (
    SELECT wrestler_a_id FROM matches WHERE meet_id IN (SELECT meet_id FROM public_meet_tokens)
    UNION
    SELECT wrestler_b_id FROM matches WHERE meet_id IN (SELECT meet_id FROM public_meet_tokens)
  )
);

-- Allow anyone to view team basic info for published meets
CREATE POLICY "Anyone can view teams in published meets"
ON public.teams FOR SELECT
USING (
  id IN (
    SELECT team_id FROM wrestlers WHERE id IN (
      SELECT wrestler_a_id FROM matches WHERE meet_id IN (SELECT meet_id FROM public_meet_tokens)
      UNION
      SELECT wrestler_b_id FROM matches WHERE meet_id IN (SELECT meet_id FROM public_meet_tokens)
    )
  )
);