import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Users, Shuffle, Check } from 'lucide-react';

interface Meet {
  id: string;
  name: string;
  meet_date: string;
  status: string;
}

interface ParticipatingTeam {
  team_id: string;
  team_name: string;
  abbreviation: string;
  primary_color: string | null;
  attending_count: number;
  unconfirmed_count: number;
  is_finalized: boolean;
  is_host: boolean;
}

interface Match {
  id: string;
  wrestler_a_id: string;
  wrestler_b_id: string;
  wrestler_a_name: string;
  wrestler_b_name: string;
  wrestler_a_team: string;
  wrestler_b_team: string;
  mat_number: number | null;
  match_order: number | null;
  status: string;
}

interface ManagePairingsSheetProps {
  meet: Meet;
  hostTeamId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManagePairingsSheet({ meet, hostTeamId, open, onOpenChange }: ManagePairingsSheetProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [teams, setTeams] = useState<ParticipatingTeam[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, meet.id]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch participating teams and their attendance status
    const [meetTeamsRes, hostTeamRes] = await Promise.all([
      supabase
        .from('meet_teams')
        .select(`
          team_id,
          teams (
            id,
            name,
            abbreviation,
            primary_color
          )
        `)
        .eq('meet_id', meet.id),
      // Also fetch the host team
      supabase
        .from('teams')
        .select('id, name, abbreviation, primary_color')
        .eq('id', hostTeamId)
        .single()
    ]);

    if (meetTeamsRes.error) {
      console.error('Error fetching teams:', meetTeamsRes.error);
      setLoading(false);
      return;
    }

    // Build a list of all team IDs (including host)
    const allTeamIds = new Set<string>();
    meetTeamsRes.data?.forEach(t => allTeamIds.add(t.team_id));
    if (hostTeamRes.data) {
      allTeamIds.add(hostTeamRes.data.id);
    }
    
    const teamsWithAttendance: ParticipatingTeam[] = [];
    
    // Add host team first
    if (hostTeamRes.data) {
      const { data: hostAttendance } = await supabase
        .from('meet_attendance')
        .select('status')
        .eq('meet_id', meet.id)
        .eq('team_id', hostTeamRes.data.id);

      const attendingCount = hostAttendance?.filter(a => 
        ['attending', 'arriving_late', 'leaving_early'].includes(a.status)
      ).length || 0;
      
      const unconfirmedCount = hostAttendance?.filter(a => 
        ['unconfirmed', 'pending'].includes(a.status)
      ).length || 0;

      teamsWithAttendance.push({
        team_id: hostTeamRes.data.id,
        team_name: hostTeamRes.data.name,
        abbreviation: hostTeamRes.data.abbreviation,
        primary_color: hostTeamRes.data.primary_color,
        attending_count: attendingCount,
        unconfirmed_count: unconfirmedCount,
        is_finalized: unconfirmedCount === 0 && attendingCount > 0,
        is_host: true,
      });
    }
    
    // Add other participating teams (excluding host if already added)
    for (const meetTeam of meetTeamsRes.data || []) {
      if (!meetTeam.teams) continue;
      if (meetTeam.team_id === hostTeamId) continue; // Skip if it's the host team
      
      const { data: attendance } = await supabase
        .from('meet_attendance')
        .select('status')
        .eq('meet_id', meet.id)
        .eq('team_id', meetTeam.team_id);

      const attendingCount = attendance?.filter(a => 
        ['attending', 'arriving_late', 'leaving_early'].includes(a.status)
      ).length || 0;
      
      const unconfirmedCount = attendance?.filter(a => 
        ['unconfirmed', 'pending'].includes(a.status)
      ).length || 0;

      teamsWithAttendance.push({
        team_id: meetTeam.team_id,
        team_name: (meetTeam.teams as any).name,
        abbreviation: (meetTeam.teams as any).abbreviation,
        primary_color: (meetTeam.teams as any).primary_color,
        attending_count: attendingCount,
        unconfirmed_count: unconfirmedCount,
        is_finalized: unconfirmedCount === 0 && attendingCount > 0,
        is_host: false,
      });
    }

    setTeams(teamsWithAttendance);

    // Fetch existing matches
    const { data: matchData } = await supabase
      .from('matches')
      .select(`
        id,
        wrestler_a_id,
        wrestler_b_id,
        mat_number,
        match_order,
        status
      `)
      .eq('meet_id', meet.id)
      .order('match_order', { ascending: true });

    if (matchData && matchData.length > 0) {
      // Get wrestler details
      const wrestlerIds = [...new Set([
        ...matchData.map(m => m.wrestler_a_id),
        ...matchData.map(m => m.wrestler_b_id)
      ])];

      const { data: wrestlers } = await supabase
        .from('wrestlers')
        .select('id, first_name, last_name, team_id')
        .in('id', wrestlerIds);

      const { data: wrestlerTeams } = await supabase
        .from('teams')
        .select('id, abbreviation')
        .in('id', wrestlers?.map(w => w.team_id) || []);

      const wrestlerMap = new Map(wrestlers?.map(w => [w.id, w]) || []);
      const teamMap = new Map(wrestlerTeams?.map(t => [t.id, t.abbreviation]) || []);

      const enrichedMatches: Match[] = matchData.map(m => {
        const wrestlerA = wrestlerMap.get(m.wrestler_a_id);
        const wrestlerB = wrestlerMap.get(m.wrestler_b_id);
        return {
          ...m,
          wrestler_a_name: wrestlerA ? `${wrestlerA.first_name} ${wrestlerA.last_name}` : 'Unknown',
          wrestler_b_name: wrestlerB ? `${wrestlerB.first_name} ${wrestlerB.last_name}` : 'Unknown',
          wrestler_a_team: wrestlerA ? teamMap.get(wrestlerA.team_id) || '' : '',
          wrestler_b_team: wrestlerB ? teamMap.get(wrestlerB.team_id) || '' : '',
        };
      });

      setMatches(enrichedMatches);
    } else {
      setMatches([]);
    }

    setLoading(false);
  };

  const allTeamsFinalized = teams.length >= 2 && teams.every(t => t.is_finalized);

  const generatePairings = async () => {
    if (!allTeamsFinalized) {
      toast({
        variant: 'destructive',
        title: 'Cannot generate pairings',
        description: 'All teams must finalize their attendance before generating pairings.',
      });
      return;
    }

    setGenerating(true);

    try {
      const response = await supabase.functions.invoke('generate-pairings', {
        body: {
          meet_id: meet.id,
          host_team_id: hostTeamId,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: 'Pairings generated!',
        description: `Created ${response.data?.matches_created || 0} matches.`,
      });

      fetchData();
    } catch (error: any) {
      console.error('Error generating pairings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to generate pairings.',
      });
    } finally {
      setGenerating(false);
    }
  };

  const getContrastColor = (hexColor: string | null) => {
    if (!hexColor) return 'hsl(var(--foreground))';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Manage Pairings - {meet.name}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Participating Teams Status */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Participating Teams</h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : teams.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No teams have been added to this meet yet.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                {teams.map((team) => (
                  <div
                    key={team.team_id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        style={{
                          backgroundColor: team.primary_color || 'hsl(var(--muted))',
                          color: getContrastColor(team.primary_color),
                        }}
                      >
                        {team.abbreviation}
                        {team.is_host && ' ★'}
                      </Badge>
                      <span className="font-medium">{team.team_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {team.attending_count} attending
                      </span>
                      {team.is_finalized ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                          <Check className="w-3 h-3 mr-1" />
                          Finalized
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {team.unconfirmed_count} unconfirmed
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warning if not all finalized */}
          {!loading && teams.length >= 2 && !allTeamsFinalized && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                All teams must finalize their attendance before you can generate pairings. 
                Teams with unconfirmed wrestlers need to confirm attendance status.
              </AlertDescription>
            </Alert>
          )}

          {/* Generate Pairings Button */}
          {!loading && teams.length >= 2 && (
            <Button
              onClick={generatePairings}
              disabled={!allTeamsFinalized || generating}
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Shuffle className="w-4 h-4 mr-2" />
                  Generate Pairings
                </>
              )}
            </Button>
          )}

          {/* Existing Matches */}
          {matches.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Current Pairings ({matches.length})
              </h3>
              <div className="space-y-2">
                {matches.map((match, index) => (
                  <div
                    key={match.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-8">
                        #{index + 1}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm">
                          <span className="font-medium">{match.wrestler_a_name}</span>
                          <span className="text-muted-foreground"> ({match.wrestler_a_team})</span>
                        </span>
                        <span className="text-xs text-muted-foreground">vs</span>
                        <span className="text-sm">
                          <span className="font-medium">{match.wrestler_b_name}</span>
                          <span className="text-muted-foreground"> ({match.wrestler_b_team})</span>
                        </span>
                      </div>
                    </div>
                    {match.mat_number && (
                      <Badge variant="outline">Mat {match.mat_number}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && matches.length === 0 && teams.length >= 2 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pairings yet. Generate pairings once all teams have finalized attendance.</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
