-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Anyone can view published meets" ON public.meets;
DROP POLICY IF EXISTS "Anyone can view matches in published meets" ON public.matches;
DROP POLICY IF EXISTS "Anyone can view wrestlers in published meets" ON public.wrestlers;
DROP POLICY IF EXISTS "Anyone can view teams in published meets" ON public.teams;

-- Create a security definer function to check if a meet is published
-- This bypasses RLS and prevents recursion
CREATE OR REPLACE FUNCTION public.is_meet_published(_meet_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.public_meet_tokens
    WHERE meet_id = _meet_id
  )
$$;

-- Create a function to check if a wrestler is in a published meet
CREATE OR REPLACE FUNCTION public.is_wrestler_in_published_meet(_wrestler_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.matches m
    JOIN public.public_meet_tokens pmt ON pmt.meet_id = m.meet_id
    WHERE m.wrestler_a_id = _wrestler_id OR m.wrestler_b_id = _wrestler_id
  )
$$;

-- Create a function to check if a team has wrestlers in published meets
CREATE OR REPLACE FUNCTION public.is_team_in_published_meet(_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.wrestlers w
    JOIN public.matches m ON (m.wrestler_a_id = w.id OR m.wrestler_b_id = w.id)
    JOIN public.public_meet_tokens pmt ON pmt.meet_id = m.meet_id
    WHERE w.team_id = _team_id
  )
$$;

-- Re-create policies using the security definer functions
CREATE POLICY "Anyone can view published meets"
ON public.meets FOR SELECT
USING (public.is_meet_published(id));

CREATE POLICY "Anyone can view matches in published meets"
ON public.matches FOR SELECT
USING (public.is_meet_published(meet_id));

CREATE POLICY "Anyone can view wrestlers in published meets"
ON public.wrestlers FOR SELECT
USING (public.is_wrestler_in_published_meet(id));

CREATE POLICY "Anyone can view teams in published meets"
ON public.teams FOR SELECT
USING (public.is_team_in_published_meet(id));