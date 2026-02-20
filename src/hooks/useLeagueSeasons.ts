import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

interface UseLeagueSeasonsResult {
  seasons: Season[];
  currentSeason: Season | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createSeason: (data: { name: string; start_date: string; end_date: string }) => Promise<Season | null>;
  setCurrentSeason: (seasonId: string) => Promise<boolean>;
  deleteSeason: (seasonId: string) => Promise<boolean>;
}

export function useLeagueSeasons(leagueId: string | undefined): UseLeagueSeasonsResult {
  const { currentContext } = useUserContext();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [currentSeason, setCurrentSeasonState] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOrganizer = currentContext?.type === 'league' && (currentContext as any).role === 'organizer';

  const fetchSeasons = useCallback(async () => {
    if (!leagueId) {
      setSeasons([]);
      setCurrentSeasonState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('seasons')
        .select('*')
        .eq('league_id', leagueId)
        .order('start_date', { ascending: false });

      if (fetchError) throw fetchError;

      setSeasons(data || []);
      const current = data?.find(s => s.is_current) || null;
      setCurrentSeasonState(current);
    } catch (err: any) {
      console.error('Error fetching league seasons:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  const createSeason = async (data: { name: string; start_date: string; end_date: string }): Promise<Season | null> => {
    if (!leagueId || !isOrganizer) {
      setError('Only league organizers can create seasons');
      return null;
    }

    try {
      // Unset current season if exists
      await supabase
        .from('seasons')
        .update({ is_current: false })
        .eq('league_id', leagueId)
        .eq('is_current', true);

      // Create new season
      const { data: newSeason, error } = await supabase
        .from('seasons')
        .insert({
          ...data,
          league_id: leagueId,
          is_current: true,
        })
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
    if (!leagueId || !isOrganizer) return false;

    try {
      // Unset all current flags
      await supabase
        .from('seasons')
        .update({ is_current: false })
        .eq('league_id', leagueId);

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

  const deleteSeason = async (seasonId: string): Promise<boolean> => {
    if (!isOrganizer) return false;

    try {
      const { error } = await supabase
        .from('seasons')
        .delete()
        .eq('id', seasonId);

      if (error) throw error;

      await fetchSeasons();
      return true;
    } catch (err: any) {
      console.error('Error deleting season:', err);
      setError(err.message);
      return false;
    }
  };

  return {
    seasons,
    currentSeason,
    loading,
    error,
    refetch: fetchSeasons,
    createSeason,
    setCurrentSeason,
    deleteSeason,
  };
}
