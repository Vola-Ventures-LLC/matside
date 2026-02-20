import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, Calendar, MapPin } from 'lucide-react';
import { format, parseISO, differenceInYears } from 'date-fns';

interface Meet {
  id: string;
  name: string;
  meet_date: string;
  meet_time: string | null;
  location_address: string | null;
}

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  primary_color: string | null;
}

interface Wrestler {
  id: string;
  first_name: string;
  last_name: string;
  weight: number;
  date_of_birth: string;
  team_id: string;
}

interface Match {
  id: string;
  wrestler_a_id: string;
  wrestler_b_id: string;
  mat_number: number | null;
  match_order: number | null;
}

export default function PublicMeetView() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meet, setMeet] = useState<Meet | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [wrestlers, setWrestlers] = useState<Map<string, Wrestler>>(new Map());
  const [teamMap, setTeamMap] = useState<Map<string, Team>>(new Map());

  useEffect(() => {
    if (token) {
      fetchPublicData();
    }
  }, [token]);

  const fetchPublicData = async () => {
    setLoading(true);
    setError(null);

    // Use the secure RPC function to get meet info from token
    // This prevents token enumeration while allowing public access with a valid token
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('get_public_meet_by_token', { _token: token })
      .maybeSingle();

    if (tokenError || !tokenData) {
      setError('Invalid or expired link');
      setLoading(false);
      return;
    }

    const meetId = tokenData.meet_id;

    // Fetch meet details
    const { data: meetData, error: meetError } = await supabase
      .from('meets')
      .select('id, name, meet_date, meet_time, location_address')
      .eq('id', meetId)
      .single();

    if (meetError || !meetData) {
      setError('Meet not found');
      setLoading(false);
      return;
    }

    setMeet(meetData);

    // Fetch matches
    const { data: matchesData } = await supabase
      .from('matches')
      .select('id, wrestler_a_id, wrestler_b_id, mat_number, match_order')
      .eq('meet_id', meetId)
      .order('mat_number', { ascending: true })
      .order('match_order', { ascending: true });

    setMatches(matchesData || []);

    if (!matchesData || matchesData.length === 0) {
      setLoading(false);
      return;
    }

    // Get all wrestler IDs
    const wrestlerIds = [...new Set([
      ...matchesData.map(m => m.wrestler_a_id),
      ...matchesData.map(m => m.wrestler_b_id),
    ])];

    // Fetch wrestlers
    const { data: wrestlersData } = await supabase
      .from('wrestlers')
      .select('id, first_name, last_name, weight, date_of_birth, team_id')
      .in('id', wrestlerIds);

    const wrestlerMapData = new Map(wrestlersData?.map(w => [w.id, w]) || []);
    setWrestlers(wrestlerMapData);

    // Fetch teams
    const teamIds = [...new Set(wrestlersData?.map(w => w.team_id) || [])];
    const { data: teamsData } = await supabase
      .from('teams')
      .select('id, name, abbreviation, primary_color')
      .in('id', teamIds);

    setTeams(teamsData || []);
    setTeamMap(new Map(teamsData?.map(t => [t.id, t]) || []));

    setLoading(false);
  };

  const getAge = (dob: string) => differenceInYears(new Date(), parseISO(dob));

  const getContrastColor = (hexColor: string | null) => {
    if (!hexColor) return 'hsl(var(--foreground))';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  // Group matches by mat
  const matchesByMat = matches.reduce((acc, match) => {
    const mat = match.mat_number || 0;
    if (!acc[mat]) acc[mat] = [];
    acc[mat].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  // Sort matches within each mat by order, then by wrestler last name
  Object.keys(matchesByMat).forEach(mat => {
    matchesByMat[Number(mat)].sort((a, b) => {
      // First by match_order if available
      if (a.match_order !== null && b.match_order !== null) {
        return a.match_order - b.match_order;
      }
      // Then by wrestler last name
      const wrestlerA = wrestlers.get(a.wrestler_a_id);
      const wrestlerB = wrestlers.get(b.wrestler_a_id);
      if (wrestlerA && wrestlerB) {
        return wrestlerA.last_name.localeCompare(wrestlerB.last_name);
      }
      return 0;
    });
  });

  // Group matches by team for team schedule view
  const matchesByTeam = teams.map(team => {
    const teamMatches = matches.filter(m => {
      const wrestlerA = wrestlers.get(m.wrestler_a_id);
      const wrestlerB = wrestlers.get(m.wrestler_b_id);
      return wrestlerA?.team_id === team.id || wrestlerB?.team_id === team.id;
    });

    // Sort by last name, first name
    teamMatches.sort((a, b) => {
      const getTeamWrestler = (match: Match) => {
        const wA = wrestlers.get(match.wrestler_a_id);
        const wB = wrestlers.get(match.wrestler_b_id);
        return wA?.team_id === team.id ? wA : wB;
      };
      const wrestlerA = getTeamWrestler(a);
      const wrestlerB = getTeamWrestler(b);
      if (!wrestlerA || !wrestlerB) return 0;
      const lastNameCompare = wrestlerA.last_name.localeCompare(wrestlerB.last_name);
      if (lastNameCompare !== 0) return lastNameCompare;
      return wrestlerA.first_name.localeCompare(wrestlerB.first_name);
    });

    return { team, matches: teamMatches };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-medium text-destructive">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              This link may have expired or been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!meet) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">{meet.name}</h1>
          <div className="flex items-center justify-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>
                {format(parseISO(meet.meet_date), 'EEEE, MMMM d, yyyy')}
                {meet.meet_time && ` at ${format(new Date(`2000-01-01T${meet.meet_time}`), 'h:mm a')}`}
              </span>
            </div>
          </div>
          {meet.location_address && (
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{meet.location_address}</span>
            </div>
          )}
        </div>

        {/* Teams */}
        <div className="flex flex-wrap justify-center gap-2">
          {teams.map(team => (
            <Badge
              key={team.id}
              style={{
                backgroundColor: team.primary_color || 'hsl(var(--muted))',
                color: getContrastColor(team.primary_color),
              }}
            >
              {team.abbreviation} - {team.name}
            </Badge>
          ))}
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-6 text-sm text-muted-foreground">
          <span>{matches.length} matches</span>
          <span>{Object.keys(matchesByMat).length} mats</span>
          <span>{teams.length} teams</span>
        </div>

        {/* Schedules */}
        {matches.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No matches scheduled yet.</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="by-mat">
            <TabsList className="w-full justify-center">
              <TabsTrigger value="by-mat">By Mat</TabsTrigger>
              <TabsTrigger value="by-team">By Team</TabsTrigger>
            </TabsList>

            <TabsContent value="by-mat" className="space-y-4 mt-4">
              {Object.entries(matchesByMat)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([mat, matMatches]) => (
                  <Card key={mat}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Mat {mat === '0' ? '?' : mat}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {matMatches.map((match, idx) => {
                          const wrestlerA = wrestlers.get(match.wrestler_a_id);
                          const wrestlerB = wrestlers.get(match.wrestler_b_id);
                          const teamA = wrestlerA ? teamMap.get(wrestlerA.team_id) : null;
                          const teamB = wrestlerB ? teamMap.get(wrestlerB.team_id) : null;

                          return (
                            <div
                              key={match.id}
                              className="flex items-center justify-between p-2 rounded border bg-muted/30"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground w-6">
                                  {idx + 1}.
                                </span>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                  <div className="flex items-center gap-1.5">
                                    {teamA && (
                                      <Badge
                                        className="text-xs"
                                        style={{
                                          backgroundColor: teamA.primary_color || 'hsl(var(--muted))',
                                          color: getContrastColor(teamA.primary_color),
                                        }}
                                      >
                                        {teamA.abbreviation}
                                      </Badge>
                                    )}
                                    <span className="font-medium">
                                      {wrestlerA?.last_name}, {wrestlerA?.first_name}
                                    </span>
                                  </div>
                                  <span className="text-muted-foreground text-sm">vs</span>
                                  <div className="flex items-center gap-1.5">
                                    {teamB && (
                                      <Badge
                                        className="text-xs"
                                        style={{
                                          backgroundColor: teamB.primary_color || 'hsl(var(--muted))',
                                          color: getContrastColor(teamB.primary_color),
                                        }}
                                      >
                                        {teamB.abbreviation}
                                      </Badge>
                                    )}
                                    <span className="font-medium">
                                      {wrestlerB?.last_name}, {wrestlerB?.first_name}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="by-team" className="space-y-4 mt-4">
              {matchesByTeam.map(({ team, matches: teamMatches }) => (
                <Card key={team.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Badge
                        style={{
                          backgroundColor: team.primary_color || 'hsl(var(--muted))',
                          color: getContrastColor(team.primary_color),
                        }}
                      >
                        {team.abbreviation}
                      </Badge>
                      {team.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {teamMatches.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No matches</p>
                    ) : (
                      <div className="space-y-2">
                        {teamMatches.map(match => {
                          const wrestlerA = wrestlers.get(match.wrestler_a_id);
                          const wrestlerB = wrestlers.get(match.wrestler_b_id);
                          const isTeamA = wrestlerA?.team_id === team.id;
                          const teamWrestler = isTeamA ? wrestlerA : wrestlerB;
                          const opponent = isTeamA ? wrestlerB : wrestlerA;
                          const opponentTeam = opponent ? teamMap.get(opponent.team_id) : null;

                          return (
                            <div
                              key={match.id}
                              className="flex items-center justify-between p-2 rounded border bg-muted/30"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {teamWrestler?.last_name}, {teamWrestler?.first_name}
                                </span>
                                <span className="text-muted-foreground text-sm">vs</span>
                                <div className="flex items-center gap-1.5">
                                  {opponentTeam && (
                                    <Badge
                                      className="text-xs"
                                      style={{
                                        backgroundColor: opponentTeam.primary_color || 'hsl(var(--muted))',
                                        color: getContrastColor(opponentTeam.primary_color),
                                      }}
                                    >
                                      {opponentTeam.abbreviation}
                                    </Badge>
                                  )}
                                  <span>
                                    {opponent?.last_name}, {opponent?.first_name}
                                  </span>
                                </div>
                              </div>
                              <Badge variant="outline">
                                Mat {match.mat_number || '?'}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-8">
          Powered by MatSide
        </div>
      </div>
    </div>
  );
}
