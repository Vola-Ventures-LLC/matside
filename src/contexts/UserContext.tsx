import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

// Context types
export type ContextType = 'team' | 'league';

export interface TeamContext {
  type: 'team';
  id: string;
  name: string;
  abbreviation: string;
  primary_color: string;
}

export interface LeagueContext {
  type: 'league';
  id: string;
  name: string;
  abbreviation: string;
  primary_color: string;
  role: 'organizer' | 'admin';
}

export type UserContextItem = TeamContext | LeagueContext;

interface League {
  id: string;
  name: string;
  abbreviation: string;
  primary_color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface LeagueMember {
  id: string;
  league_id: string;
  user_id: string;
  role: 'organizer' | 'admin';
  leagues: League;
}

interface UserContextType {
  contexts: UserContextItem[];
  currentContext: UserContextItem | null;
  setCurrentContext: (context: UserContextItem | null) => void;
  loading: boolean;
  refetchContexts: () => Promise<void>;
  leagues: League[];
  createLeague: (league: {
    name: string;
    abbreviation: string;
    description?: string;
    primary_color?: string;
    website?: string;
  }) => Promise<League | null>;
}

const UserContextContext = createContext<UserContextType | undefined>(undefined);

export function UserContextProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [contexts, setContexts] = useState<UserContextItem[]>([]);
  const [currentContext, setCurrentContext] = useState<UserContextItem | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContexts = async () => {
    if (!user) {
      setContexts([]);
      setCurrentContext(null);
      setLeagues([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch teams the user manages (only teams they own)
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
      }

      // Fetch leagues the user is a member of
      const { data: leagueMembersData, error: leagueError } = await supabase
        .from('league_members')
        .select(`
          id,
          league_id,
          user_id,
          role,
          leagues (
            id,
            name,
            abbreviation,
            primary_color,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);

      if (leagueError) {
        console.error('Error fetching leagues:', leagueError);
      }

      // Build contexts array
      const teamContexts: TeamContext[] = (teamsData || []).map((team) => ({
        type: 'team' as const,
        id: team.id,
        name: team.name,
        abbreviation: team.abbreviation,
        primary_color: team.primary_color || '#DC2626',
      }));

      const leagueContexts: LeagueContext[] = ((leagueMembersData || []) as unknown as LeagueMember[])
        .filter((lm) => lm.leagues)
        .map((lm) => ({
          type: 'league' as const,
          id: lm.leagues.id,
          name: lm.leagues.name,
          abbreviation: lm.leagues.abbreviation,
          primary_color: lm.leagues.primary_color || '#3B82F6',
          role: lm.role,
        }));

      const allContexts = [...teamContexts, ...leagueContexts];
      setContexts(allContexts);

      // Extract unique leagues
      const uniqueLeagues = ((leagueMembersData || []) as unknown as LeagueMember[])
        .filter((lm) => lm.leagues)
        .map((lm) => lm.leagues);
      setLeagues(uniqueLeagues);

      // Set current context if not set
      if (allContexts.length > 0 && !currentContext) {
        // Prefer team context first
        const firstTeam = allContexts.find((c) => c.type === 'team');
        setCurrentContext(firstTeam || allContexts[0]);
      }
    } catch (error) {
      console.error('Error in fetchContexts:', error);
    }

    setLoading(false);
  };

  const createLeague = async (leagueData: {
    name: string;
    abbreviation: string;
    description?: string;
    primary_color?: string;
    website?: string;
  }) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('leagues')
      .insert({
        ...leagueData,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating league:', error);
      return null;
    }

    await fetchContexts();
    
    // Switch to the new league context
    if (data) {
      setCurrentContext({
        type: 'league',
        id: data.id,
        name: data.name,
        abbreviation: data.abbreviation,
        primary_color: data.primary_color || '#3B82F6',
        role: 'organizer',
      });
    }

    return data;
  };

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    fetchContexts();
  }, [user, authLoading]);

  return (
    <UserContextContext.Provider
      value={{
        contexts,
        currentContext,
        setCurrentContext,
        loading,
        refetchContexts: fetchContexts,
        leagues,
        createLeague,
      }}
    >
      {children}
    </UserContextContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContextContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserContextProvider');
  }
  return context;
}
