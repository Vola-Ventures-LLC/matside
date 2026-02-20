-- Create enum for league member roles
CREATE TYPE public.league_role AS ENUM ('organizer', 'admin');

-- Create enum for invitation types
CREATE TYPE public.invitation_type AS ENUM ('email', 'code');

-- Create enum for invitation/team status
CREATE TYPE public.league_team_status AS ENUM ('pending', 'active', 'declined', 'removed');

-- Leagues table
CREATE TABLE public.leagues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL CHECK (char_length(abbreviation) <= 10),
  description TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on leagues
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;

-- League members table (organizers and admins of a league)
CREATE TABLE public.league_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role league_role NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (league_id, user_id)
);

-- Enable RLS on league_members
ALTER TABLE public.league_members ENABLE ROW LEVEL SECURITY;

-- League teams table (many-to-many: teams can be in multiple leagues)
CREATE TABLE public.league_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  status league_team_status NOT NULL DEFAULT 'pending',
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (league_id, team_id)
);

-- Enable RLS on league_teams
ALTER TABLE public.league_teams ENABLE ROW LEVEL SECURITY;

-- Invitations table (for inviting teams to leagues)
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  invitation_type invitation_type NOT NULL,
  email TEXT,
  code TEXT UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_uses INTEGER DEFAULT 1,
  use_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_email_or_code CHECK (
    (invitation_type = 'email' AND email IS NOT NULL) OR
    (invitation_type = 'code' AND code IS NOT NULL)
  )
);

-- Enable RLS on invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user is a league member
CREATE OR REPLACE FUNCTION public.is_league_member(_user_id UUID, _league_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.league_members
    WHERE user_id = _user_id
      AND league_id = _league_id
  )
$$;

-- Security definer function to check if user is a league organizer
CREATE OR REPLACE FUNCTION public.is_league_organizer(_user_id UUID, _league_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.league_members
    WHERE user_id = _user_id
      AND league_id = _league_id
      AND role = 'organizer'
  )
$$;

-- RLS Policies for leagues
CREATE POLICY "League members can view their leagues"
  ON public.leagues FOR SELECT
  USING (public.is_league_member(auth.uid(), id));

CREATE POLICY "Users can create leagues"
  ON public.leagues FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "League organizers can update their leagues"
  ON public.leagues FOR UPDATE
  USING (public.is_league_organizer(auth.uid(), id));

CREATE POLICY "League organizers can delete their leagues"
  ON public.leagues FOR DELETE
  USING (public.is_league_organizer(auth.uid(), id));

-- RLS Policies for league_members
CREATE POLICY "League members can view other members"
  ON public.league_members FOR SELECT
  USING (public.is_league_member(auth.uid(), league_id));

CREATE POLICY "League organizers can add members"
  ON public.league_members FOR INSERT
  WITH CHECK (public.is_league_organizer(auth.uid(), league_id));

CREATE POLICY "League organizers can update members"
  ON public.league_members FOR UPDATE
  USING (public.is_league_organizer(auth.uid(), league_id));

CREATE POLICY "League organizers can remove members"
  ON public.league_members FOR DELETE
  USING (public.is_league_organizer(auth.uid(), league_id));

-- RLS Policies for league_teams
-- League members can view teams in their league (but NOT roster - that's on wrestlers table)
CREATE POLICY "League members can view league teams"
  ON public.league_teams FOR SELECT
  USING (public.is_league_member(auth.uid(), league_id));

-- Team managers can view their team's league memberships
CREATE POLICY "Team managers can view their team league memberships"
  ON public.league_teams FOR SELECT
  USING (team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid()));

CREATE POLICY "League organizers can add teams"
  ON public.league_teams FOR INSERT
  WITH CHECK (public.is_league_organizer(auth.uid(), league_id));

-- Team managers can update their team's league status (accept/decline invites)
CREATE POLICY "Team managers can update their team league status"
  ON public.league_teams FOR UPDATE
  USING (team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid()));

CREATE POLICY "League organizers can update league teams"
  ON public.league_teams FOR UPDATE
  USING (public.is_league_organizer(auth.uid(), league_id));

CREATE POLICY "League organizers can remove teams"
  ON public.league_teams FOR DELETE
  USING (public.is_league_organizer(auth.uid(), league_id));

-- Team managers can remove their team from a league
CREATE POLICY "Team managers can remove their team from leagues"
  ON public.league_teams FOR DELETE
  USING (team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid()));

-- RLS Policies for invitations
CREATE POLICY "League members can view invitations"
  ON public.invitations FOR SELECT
  USING (public.is_league_member(auth.uid(), league_id));

-- Anyone can view invitations by code (for redemption)
CREATE POLICY "Anyone can view invite codes"
  ON public.invitations FOR SELECT
  USING (code IS NOT NULL AND expires_at > now() AND use_count < max_uses);

CREATE POLICY "League organizers can create invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (public.is_league_organizer(auth.uid(), league_id));

CREATE POLICY "League organizers can update invitations"
  ON public.invitations FOR UPDATE
  USING (public.is_league_organizer(auth.uid(), league_id));

CREATE POLICY "League organizers can delete invitations"
  ON public.invitations FOR DELETE
  USING (public.is_league_organizer(auth.uid(), league_id));

-- Trigger for updated_at on leagues
CREATE TRIGGER update_leagues_updated_at
  BEFORE UPDATE ON public.leagues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically make creator an organizer
CREATE OR REPLACE FUNCTION public.add_league_creator_as_organizer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.league_members (league_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'organizer');
  RETURN NEW;
END;
$$;

-- Trigger to add creator as organizer
CREATE TRIGGER on_league_created
  AFTER INSERT ON public.leagues
  FOR EACH ROW
  EXECUTE FUNCTION public.add_league_creator_as_organizer();