import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Team {
  id: string;
  user_id: string;
  name: string;
  abbreviation: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  home_meet_address: string | null;
  home_meet_notes: string | null;
  match_priority_age: number;
  match_priority_weight: number;
  match_priority_experience: number;
  match_priority_skill: number;
  max_age_diff: number;
  max_matches_per_wrestler: number;
  teammates_can_wrestle: boolean;
  conflict_min_matches: number;
  conflict_max_matches: number;
  conflict_min_gap: number;
  data_sharing_consent: boolean;
  data_sharing_consent_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TeamMembership {
  team_id: string;
  role: 'owner' | 'manager';
  status: string;
  teams: Team;
}

interface TeamContextType {
  teams: Team[];
  currentTeam: Team | null;
  currentTeamRole: 'owner' | 'manager' | null;
  setCurrentTeam: (team: Team | null) => void;
  loading: boolean;
  refetchTeams: () => Promise<void>;
  createTeam: (team: {
    name: string;
    abbreviation: string;
    logo_url?: string | null;
    primary_color?: string;
    secondary_color?: string;
  }) => Promise<Team | null>;
  isOwner: boolean;
  getTeamRole: (teamId: string) => 'owner' | 'manager' | null;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamRoles, setTeamRoles] = useState<Record<string, 'owner' | 'manager'>>({});
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    if (!user) {
      setTeams([]);
      setTeamRoles({});
      setCurrentTeam(null);
      setLoading(false);
      return;
    }

    // Fetch teams via team_members table
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        team_id,
        role,
        status,
        teams (*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching teams:', error);
      setLoading(false);
      return;
    }

    const memberships = (data as unknown as TeamMembership[]) || [];
    const fetchedTeams = memberships
      .filter(m => m.teams)
      .map(m => m.teams)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    const roles: Record<string, 'owner' | 'manager'> = {};
    memberships.forEach(m => {
      if (m.teams) {
        roles[m.teams.id] = m.role;
      }
    });

    setTeams(fetchedTeams);
    setTeamRoles(roles);
    
    // Update currentTeam with fresh data, or set to first one if not set
    if (fetchedTeams.length > 0) {
      if (currentTeam) {
        // Find the updated version of the current team
        const updatedCurrentTeam = fetchedTeams.find(t => t.id === currentTeam.id);
        if (updatedCurrentTeam) {
          setCurrentTeam(updatedCurrentTeam);
        } else {
          // Current team no longer exists, fall back to first
          setCurrentTeam(fetchedTeams[0]);
        }
      } else {
        setCurrentTeam(fetchedTeams[0]);
      }
    }
    
    setLoading(false);
  };

  const createTeam = async (teamData: {
    name: string;
    abbreviation: string;
    logo_url?: string | null;
    primary_color?: string;
    secondary_color?: string;
  }) => {
    if (!user) return null;

    // Use RPC function to bypass RLS issues
    const { data, error } = await supabase
      .rpc('create_team', {
        p_name: teamData.name,
        p_abbreviation: teamData.abbreviation,
        p_logo_url: teamData.logo_url || null,
        p_primary_color: teamData.primary_color || '#DC2626',
        p_secondary_color: teamData.secondary_color || '#1F2937',
      });

    if (error) {
      console.error('Error creating team:', error);
      return null;
    }

    // The RPC returns JSON, cast it properly
    const team = data as unknown as Team;
    
    await fetchTeams();
    setCurrentTeam(team);
    return team;
  };

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    fetchTeams();
  }, [user, authLoading]);

  const currentTeamRole = currentTeam ? teamRoles[currentTeam.id] || null : null;
  const isOwner = currentTeamRole === 'owner';

  const getTeamRole = (teamId: string): 'owner' | 'manager' | null => {
    return teamRoles[teamId] || null;
  };

  return (
    <TeamContext.Provider value={{ 
      teams, 
      currentTeam, 
      currentTeamRole,
      setCurrentTeam, 
      loading, 
      refetchTeams: fetchTeams,
      createTeam,
      isOwner,
      getTeamRole
    }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}
