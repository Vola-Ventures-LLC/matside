-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#DC2626',
  secondary_color TEXT DEFAULT '#1F2937',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wrestlers table
CREATE TABLE public.wrestlers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  weight NUMERIC(5,1) NOT NULL,
  experience INTEGER NOT NULL DEFAULT 0 CHECK (experience >= 0 AND experience <= 5),
  skill INTEGER NOT NULL DEFAULT 0 CHECK (skill >= 0 AND skill <= 4),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'weighed_in', 'scratched')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meets table
CREATE TABLE public.meets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meet_date DATE NOT NULL,
  mat_count INTEGER NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'registration', 'live', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meet_registrations table (wrestlers registered for a meet)
CREATE TABLE public.meet_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meet_id UUID NOT NULL REFERENCES public.meets(id) ON DELETE CASCADE,
  wrestler_id UUID NOT NULL REFERENCES public.wrestlers(id) ON DELETE CASCADE,
  weigh_in_weight NUMERIC(5,1),
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'weighed_in', 'matched', 'scratched')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meet_id, wrestler_id)
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meet_id UUID NOT NULL REFERENCES public.meets(id) ON DELETE CASCADE,
  wrestler_a_id UUID NOT NULL REFERENCES public.wrestlers(id) ON DELETE CASCADE,
  wrestler_b_id UUID NOT NULL REFERENCES public.wrestlers(id) ON DELETE CASCADE,
  mat_number INTEGER,
  match_order INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'on_deck', 'in_progress', 'completed')),
  winner_id UUID REFERENCES public.wrestlers(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user metadata
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  current_team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wrestlers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meet_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Teams policies: Users can only see/manage their own teams
CREATE POLICY "Users can view their own teams" ON public.teams
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own teams" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own teams" ON public.teams
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own teams" ON public.teams
  FOR DELETE USING (auth.uid() = user_id);

-- Wrestlers policies: Users can manage wrestlers on their teams
CREATE POLICY "Users can view wrestlers on their teams" ON public.wrestlers
  FOR SELECT USING (
    team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create wrestlers on their teams" ON public.wrestlers
  FOR INSERT WITH CHECK (
    team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update wrestlers on their teams" ON public.wrestlers
  FOR UPDATE USING (
    team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete wrestlers on their teams" ON public.wrestlers
  FOR DELETE USING (
    team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid())
  );

-- Meets policies: Host can manage, others can view
CREATE POLICY "Users can view meets they host" ON public.meets
  FOR SELECT USING (
    host_team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create meets for their teams" ON public.meets
  FOR INSERT WITH CHECK (
    host_team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update meets they host" ON public.meets
  FOR UPDATE USING (
    host_team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete meets they host" ON public.meets
  FOR DELETE USING (
    host_team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid())
  );

-- Meet registrations policies
CREATE POLICY "Users can view registrations for their meets" ON public.meet_registrations
  FOR SELECT USING (
    meet_id IN (
      SELECT id FROM public.meets WHERE host_team_id IN (
        SELECT id FROM public.teams WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage registrations for their meets" ON public.meet_registrations
  FOR INSERT WITH CHECK (
    meet_id IN (
      SELECT id FROM public.meets WHERE host_team_id IN (
        SELECT id FROM public.teams WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update registrations for their meets" ON public.meet_registrations
  FOR UPDATE USING (
    meet_id IN (
      SELECT id FROM public.meets WHERE host_team_id IN (
        SELECT id FROM public.teams WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete registrations for their meets" ON public.meet_registrations
  FOR DELETE USING (
    meet_id IN (
      SELECT id FROM public.meets WHERE host_team_id IN (
        SELECT id FROM public.teams WHERE user_id = auth.uid()
      )
    )
  );

-- Matches policies
CREATE POLICY "Users can view matches for their meets" ON public.matches
  FOR SELECT USING (
    meet_id IN (
      SELECT id FROM public.meets WHERE host_team_id IN (
        SELECT id FROM public.teams WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage matches for their meets" ON public.matches
  FOR INSERT WITH CHECK (
    meet_id IN (
      SELECT id FROM public.meets WHERE host_team_id IN (
        SELECT id FROM public.teams WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update matches for their meets" ON public.matches
  FOR UPDATE USING (
    meet_id IN (
      SELECT id FROM public.meets WHERE host_team_id IN (
        SELECT id FROM public.teams WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete matches for their meets" ON public.matches
  FOR DELETE USING (
    meet_id IN (
      SELECT id FROM public.meets WHERE host_team_id IN (
        SELECT id FROM public.teams WHERE user_id = auth.uid()
      )
    )
  );

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wrestlers_updated_at
  BEFORE UPDATE ON public.wrestlers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meets_updated_at
  BEFORE UPDATE ON public.meets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();