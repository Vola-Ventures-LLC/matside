import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserContext } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, MoreHorizontal, UserX, CheckCircle } from 'lucide-react';

interface LeagueTeam {
  id: string;
  league_id: string;
  team_id: string;
  status: 'pending' | 'active' | 'declined' | 'removed';
  joined_at: string | null;
  created_at: string;
  teams: {
    id: string;
    name: string;
    abbreviation: string;
    primary_color: string;
  };
}

export default function LeagueTeams() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentContext } = useUserContext();
  const [teams, setTeams] = useState<LeagueTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentContext?.type !== 'league') {
      navigate('/dashboard');
      return;
    }

    fetchTeams();
  }, [currentContext, navigate]);

  const fetchTeams = async () => {
    if (!currentContext || currentContext.type !== 'league') return;

    setLoading(true);

    const { data, error } = await supabase
      .from('league_teams')
      .select(`
        id,
        league_id,
        team_id,
        status,
        joined_at,
        created_at,
        teams (
          id,
          name,
          abbreviation,
          primary_color
        )
      `)
      .eq('league_id', currentContext.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: 'Error',
        description: 'Failed to load teams',
        variant: 'destructive',
      });
    } else {
      setTeams((data as unknown as LeagueTeam[]) || []);
    }

    setLoading(false);
  };

  const updateTeamStatus = async (teamId: string, status: 'active' | 'removed') => {
    const { error } = await supabase
      .from('league_teams')
      .update({
        status,
        joined_at: status === 'active' ? new Date().toISOString() : null,
      })
      .eq('id', teamId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update team status',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Team ${status === 'active' ? 'activated' : 'removed'}`,
      });
      fetchTeams();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pending</Badge>;
      case 'declined':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Declined</Badge>;
      case 'removed':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Removed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (currentContext?.type !== 'league') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl text-foreground mb-2">Teams</h1>
            <p className="text-muted-foreground">
              Manage teams in your league
            </p>
          </div>
          <Button onClick={() => navigate('/league/invitations')}>
            Invite Teams
          </Button>
        </div>

        {/* Teams Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              League Teams
            </CardTitle>
            <CardDescription>
              Teams that have been invited or joined your league
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading teams...
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No teams in your league yet</p>
                <Button onClick={() => navigate('/league/invitations')}>
                  Invite Teams
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {team.teams ? (
                            <>
                              <div
                                className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold text-white"
                                style={{ backgroundColor: team.teams.primary_color }}
                              >
                                {team.teams.abbreviation.slice(0, 2)}
                              </div>
                              <div>
                                <p className="font-medium">{team.teams.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {team.teams.abbreviation}
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold text-white bg-muted">
                                ?
                              </div>
                              <div>
                                <p className="font-medium text-muted-foreground">Team (pending access)</p>
                                <p className="text-sm text-muted-foreground">
                                  Awaiting confirmation
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(team.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {team.joined_at
                          ? new Date(team.joined_at).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border z-50">
                            {team.status !== 'active' && (
                              <DropdownMenuItem
                                onClick={() => updateTeamStatus(team.id, 'active')}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            {team.status !== 'removed' && (
                              <DropdownMenuItem
                                onClick={() => updateTeamStatus(team.id, 'removed')}
                                className="text-destructive"
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
