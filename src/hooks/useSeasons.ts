import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTeam } from '@/contexts/TeamContext';
import { useUserContext } from '@/contexts/UserContext';

export interface Season {
  id: string;
  league_id: string | null;
  team_id: string | null;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface WrestlerSeason {
  id: string;
  wrestler_id: string;
  season_id: string;
  status: string;
  created_at: string;
}

interface UseSeasonResult {
  seasons: Season[];
  currentSeason: Season | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createSeason: (data: { name: string; start_date: string; end_date: string }) => Promise<Season | null>;
  setCurrentSeason: (seasonId: string) => Promise<boolean>;
  getWrestlerSeasonStatus: (wrestlerId: string) => WrestlerSeason | null;
  wrestlerSeasons: WrestlerSeason[];
  addWrestlerToSeason: (wrestlerId: string, seasonId?: string) => Promise<boolean>;
  removeWrestlerFromSeason: (wrestlerId: string, seasonId?: string) => Promise<boolean>;
  activateWrestlerInSeason: (wrestlerId: string, seasonId?: string) => Promise<boolean>;
  archiveWrestlerInSeason: (wrestlerId: string, seasonId?: string) => Promise<boolean>;
  // New fields for permission checking
  canCreateSeason: boolean;
  isLeagueManaged: boolean;
  leagueId: string | null;
}

export function useSeasons(): UseSeasonResult {
  const { currentTeam, isOwner } = useTeam();
  const { contexts } = useUserContext();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [currentSeason, setCurrentSeasonState] = useState<Season | null>(null);
  const [wrestlerSeasons, setWrestlerSeasons] = useState<WrestlerSeason[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leagueId, setLeagueId] = useState<string | null>(null);

  // Check if user is a league organizer for the team's league
  const isLeagueOrganizer = useCallback((lgId: string | null) => {
    if (!lgId) return false;
    const leagueContext = contexts.find(c => c.type === 'league' && c.id === lgId);
    return leagueContext?.type === 'league' && (leagueContext as any).role === 'organizer';
  }, [contexts]);

  const fetchSeasons = useCallback(async () => {
    if (!currentTeam) {
      setSeasons([]);
      setCurrentSeasonState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, check if team belongs to any league
      const { data: leagueTeams } = await supabase
        .from('league_teams')
        .select('league_id')
        .eq('team_id', currentTeam.id)
        .eq('status', 'active')
        .limit(1);

      const fetchedLeagueId = leagueTeams?.[0]?.league_id || null;
      setLeagueId(fetchedLeagueId);

      // Fetch seasons based on league membership or team-specific
      let query = supabase
        .from('seasons')
        .select('*')
        .order('start_date', { ascending: false });

      if (fetchedLeagueId) {
        query = query.eq('league_id', fetchedLeagueId);
      } else {
        query = query.eq('team_id', currentTeam.id);
      }

      const { data: seasonsData, error: seasonsError } = await query;

      if (seasonsError) {
        throw seasonsError;
      }

      setSeasons(seasonsData || []);
      
      // Find current season
      const current = seasonsData?.find(s => s.is_current) || null;
      setCurrentSeasonState(current);

      // Fetch wrestler_seasons for current team's wrestlers
      if (current) {
        const { data: wrestlerSeasonsData } = await supabase
          .from('wrestler_seasons')
          .select('*')
          .eq('season_id', current.id);

        setWrestlerSeasons(wrestlerSeasonsData || []);
      } else {
        setWrestlerSeasons([]);
      }

    } catch (err: any) {
      console.error('Error fetching seasons:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentTeam]);

  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  const createSeason = async (data: { name: string; start_date: string; end_date: string }): Promise<Season | null> => {
    if (!currentTeam) return null;

    try {
      // Determine if creating league or team season
      const isLeagueManaged = !!leagueId;
      
      // Permission check - league organizer for league seasons, team owner for team seasons
      if (isLeagueManaged && !isLeagueOrganizer(leagueId)) {
        setError('Only league organizers can create seasons for league teams');
        return null;
      }
      if (!isLeagueManaged && !isOwner) {
        setError('Only team owners can create seasons');
        return null;
      }

      // First, unset current season if exists
      if (isLeagueManaged) {
        await supabase
          .from('seasons')
          .update({ is_current: false })
          .eq('league_id', leagueId)
          .eq('is_current', true);
      } else {
        await supabase
          .from('seasons')
          .update({ is_current: false })
          .eq('team_id', currentTeam.id)
          .eq('is_current', true);
      }

      // Create new season
      const insertData = isLeagueManaged
        ? { ...data, league_id: leagueId, is_current: true }
        : { ...data, team_id: currentTeam.id, is_current: true };

      const { data: newSeason, error } = await supabase
        .from('seasons')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      await fetchSeasons();
      return newSeason;
    } catch (err: any) {
      console.error('Error creating season:', err);
      setError(err.message);
      return null;
    }
  };

  const setCurrentSeason = async (seasonId: string): Promise<boolean> => {
    if (!currentTeam) return false;

    try {
      // Check league membership
      const { data: leagueTeams } = await supabase
        .from('league_teams')
        .select('league_id')
        .eq('team_id', currentTeam.id)
        .eq('status', 'active')
        .limit(1);

      const leagueId = leagueTeams?.[0]?.league_id;

      // Unset all current flags
      if (leagueId) {
        await supabase
          .from('seasons')
          .update({ is_current: false })
          .eq('league_id', leagueId);
      } else {
        await supabase
          .from('seasons')
          .update({ is_current: false })
          .eq('team_id', currentTeam.id);
      }

      // Set new current
      const { error } = await supabase
        .from('seasons')
        .update({ is_current: true })
        .eq('id', seasonId);

      if (error) throw error;

      await fetchSeasons();
      return true;
    } catch (err: any) {
      console.error('Error setting current season:', err);
      return false;
    }
  };

  const getWrestlerSeasonStatus = (wrestlerId: string): WrestlerSeason | null => {
    return wrestlerSeasons.find(ws => ws.wrestler_id === wrestlerId) || null;
  };

  const addWrestlerToSeason = async (wrestlerId: string, seasonId?: string): Promise<boolean> => {
    const targetSeasonId = seasonId || currentSeason?.id;
    if (!targetSeasonId) return false;

    try {
      const { error } = await supabase
        .from('wrestler_seasons')
        .upsert({
          wrestler_id: wrestlerId,
          season_id: targetSeasonId,
          status: 'active',
        }, {
          onConflict: 'wrestler_id,season_id',
        });

      if (error) throw error;

      await fetchSeasons();
      return true;
    } catch (err: any) {
      console.error('Error adding wrestler to season:', err);
      return false;
    }
  };

  const removeWrestlerFromSeason = async (wrestlerId: string, seasonId?: string): Promise<boolean> => {
    const targetSeasonId = seasonId || currentSeason?.id;
    if (!targetSeasonId) return false;

    try {
      const { error } = await supabase
        .from('wrestler_seasons')
        .delete()
        .eq('wrestler_id', wrestlerId)
        .eq('season_id', targetSeasonId);

      if (error) throw error;

      await fetchSeasons();
      return true;
    } catch (err: any) {
      console.error('Error removing wrestler from season:', err);
      return false;
    }
  };

  const updateWrestlerSeasonStatus = async (wrestlerId: string, status: string, seasonId?: string): Promise<boolean> => {
    const targetSeasonId = seasonId || currentSeason?.id;
    if (!targetSeasonId) return false;

    try {
      const { error } = await supabase
        .from('wrestler_seasons')
        .update({ status })
        .eq('wrestler_id', wrestlerId)
        .eq('season_id', targetSeasonId);

      if (error) throw error;

      await fetchSeasons();
      return true;
    } catch (err: any) {
      console.error('Error updating wrestler season status:', err);
      return false;
    }
  };

  const activateWrestlerInSeason = (wrestlerId: string, seasonId?: string) => 
    updateWrestlerSeasonStatus(wrestlerId, 'active', seasonId);

  const archiveWrestlerInSeason = (wrestlerId: string, seasonId?: string) => 
    updateWrestlerSeasonStatus(wrestlerId, 'archived', seasonId);

  // Calculate if user can create seasons
  const isLeagueManaged = !!leagueId;
  const canCreateSeason = isLeagueManaged 
    ? isLeagueOrganizer(leagueId) 
    : isOwner;

  return {
    seasons,
    currentSeason,
    loading,
    error,
    refetch: fetchSeasons,
    createSeason,
    setCurrentSeason,
    getWrestlerSeasonStatus,
    wrestlerSeasons,
    addWrestlerToSeason,
    removeWrestlerFromSeason,
    activateWrestlerInSeason,
    archiveWrestlerInSeason,
    canCreateSeason,
    isLeagueManaged,
    leagueId,
  };
}
