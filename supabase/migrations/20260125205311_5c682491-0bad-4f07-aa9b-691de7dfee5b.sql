-- Create seasons table (can belong to league OR team for independent teams)
CREATE TABLE public.seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Either league_id or team_id must be set, but not both
  CONSTRAINT seasons_scope_check CHECK (
    (league_id IS NOT NULL AND team_id IS NULL) OR 
    (league_id IS NULL AND team_id IS NOT NULL)
  )
);

-- Create wrestler_seasons join table
CREATE TABLE public.wrestler_seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wrestler_id UUID NOT NULL REFERENCES public.wrestlers(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wrestler_id, season_id)
);

-- Enable RLS
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wrestler_seasons ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_seasons_league ON public.seasons(league_id) WHERE league_id IS NOT NULL;
CREATE INDEX idx_seasons_team ON public.seasons(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_seasons_current ON public.seasons(is_current) WHERE is_current = true;
CREATE INDEX idx_wrestler_seasons_wrestler ON public.wrestler_seasons(wrestler_id);
CREATE INDEX idx_wrestler_seasons_season ON public.wrestler_seasons(season_id);
CREATE INDEX idx_wrestler_seasons_status ON public.wrestler_seasons(status);

-- Trigger for updated_at
CREATE TRIGGER update_seasons_updated_at
  BEFORE UPDATE ON public.seasons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for seasons

-- League organizers can manage league seasons
CREATE POLICY "League organizers can create league seasons"
  ON public.seasons FOR INSERT
  WITH CHECK (
    (league_id IS NOT NULL AND is_league_organizer(auth.uid(), league_id)) OR
    (team_id IS NOT NULL AND is_team_owner(auth.uid(), team_id))
  );

CREATE POLICY "League organizers can update league seasons"
  ON public.seasons FOR UPDATE
  USING (
    (league_id IS NOT NULL AND is_league_organizer(auth.uid(), league_id)) OR
    (team_id IS NOT NULL AND is_team_owner(auth.uid(), team_id))
  );

CREATE POLICY "League organizers can delete league seasons"
  ON public.seasons FOR DELETE
  USING (
    (league_id IS NOT NULL AND is_league_organizer(auth.uid(), league_id)) OR
    (team_id IS NOT NULL AND is_team_owner(auth.uid(), team_id))
  );

-- Anyone in league or team can view seasons
CREATE POLICY "Users can view their seasons"
  ON public.seasons FOR SELECT
  USING (
    (league_id IS NOT NULL AND is_league_member(auth.uid(), league_id)) OR
    (team_id IS NOT NULL AND is_team_manager(auth.uid(), team_id))
  );

-- RLS Policies for wrestler_seasons

-- Team managers can manage their wrestlers' season assignments
CREATE POLICY "Team managers can create wrestler season assignments"
  ON public.wrestler_seasons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wrestlers w
      WHERE w.id = wrestler_id AND is_team_manager(auth.uid(), w.team_id)
    )
  );

CREATE POLICY "Team managers can update wrestler season assignments"
  ON public.wrestler_seasons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM wrestlers w
      WHERE w.id = wrestler_id AND is_team_manager(auth.uid(), w.team_id)
    )
  );

CREATE POLICY "Team managers can delete wrestler season assignments"
  ON public.wrestler_seasons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM wrestlers w
      WHERE w.id = wrestler_id AND is_team_manager(auth.uid(), w.team_id)
    )
  );

CREATE POLICY "Team managers can view wrestler season assignments"
  ON public.wrestler_seasons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wrestlers w
      WHERE w.id = wrestler_id AND is_team_manager(auth.uid(), w.team_id)
    )
  );