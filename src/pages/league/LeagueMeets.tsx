import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserContext } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Calendar, MoreHorizontal, Pencil, Trash2, Star } from 'lucide-react';
import { format } from 'date-fns';
import { CreateLeagueMeetModal } from '@/components/league/CreateLeagueMeetModal';
import { EditLeagueMeetSheet } from '@/components/league/EditLeagueMeetSheet';

interface TeamInfo {
  id: string;
  name: string;
  abbreviation: string;
  primary_color: string;
}

interface MeetTeam {
  id: string;
  team_id: string;
  status: string;
  teams: TeamInfo;
}

interface LeagueMeet {
  id: string;
  name: string;
  meet_date: string;
  status: string;
  host_team_id: string;
  league_id: string;
  created_at: string;
  teams: TeamInfo;
  meet_teams: MeetTeam[];
}

export default function LeagueMeets() {
  const navigate = useNavigate();
  const { currentContext } = useUserContext();
  const { toast } = useToast();
  const [meets, setMeets] = useState<LeagueMeet[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editMeet, setEditMeet] = useState<LeagueMeet | null>(null);

  const isLeagueContext = currentContext?.type === 'league';

  useEffect(() => {
    if (!isLeagueContext) {
      navigate('/dashboard');
      return;
    }
    fetchMeets();
  }, [currentContext, navigate, isLeagueContext]);

  const fetchMeets = async () => {
    if (!currentContext || currentContext.type !== 'league') return;

    setLoading(true);
    const { data, error } = await supabase
      .from('meets')
      .select(`
        id,
        name,
        meet_date,
        status,
        host_team_id,
        league_id,
        created_at,
        teams:host_team_id (
          id,
          name,
          abbreviation,
          primary_color
        ),
        meet_teams (
          id,
          team_id,
          status,
          teams:team_id (
            id,
            name,
            abbreviation,
            primary_color
          )
        )
      `)
      .eq('league_id', currentContext.id)
      .order('meet_date', { ascending: true });

    if (error) {
      console.error('Error fetching meets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load meets',
        variant: 'destructive',
      });
    } else {
      setMeets((data as unknown as LeagueMeet[]) || []);
    }
    setLoading(false);
  };

  const deleteMeet = async (meetId: string) => {
    const { error } = await supabase
      .from('meets')
      .delete()
      .eq('id', meetId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete meet',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Meet Deleted',
        description: 'The meet has been removed from the schedule',
      });
      fetchMeets();
    }
  };

  const getContrastColor = (hexColor: string) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  if (!isLeagueContext) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Meet Schedule</h1>
            <p className="text-muted-foreground mt-1">
              Manage the league's meet schedule and participating teams
            </p>
          </div>
          <Button className="btn-primary" onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Meet
          </Button>
        </div>

        <Card className="card-athletic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              All Meets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading meets...</p>
              </div>
            ) : meets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No meets scheduled yet
                </p>
                <Button className="btn-primary" onClick={() => setCreateModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule First Meet
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Teams</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meets.map((meet) => {
                    const participatingTeams = meet.meet_teams?.filter(
                      mt => mt.team_id !== meet.host_team_id
                    ) || [];
                    
                    return (
                      <TableRow key={meet.id}>
                        <TableCell className="font-medium">
                          {format(new Date(meet.meet_date + 'T00:00:00'), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>{meet.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Host team with star */}
                            {meet.teams && (
                              <Badge
                                className="flex items-center gap-1"
                                style={{
                                  backgroundColor: meet.teams.primary_color || '#666',
                                  color: getContrastColor(meet.teams.primary_color || '#666'),
                                }}
                              >
                                <Star className="w-3 h-3 fill-current" />
                                {meet.teams.abbreviation}
                              </Badge>
                            )}
                            {/* Participating teams */}
                            {participatingTeams.map((mt) => (
                              <Badge
                                key={mt.id}
                                style={{
                                  backgroundColor: mt.teams?.primary_color || '#666',
                                  color: getContrastColor(mt.teams?.primary_color || '#666'),
                                }}
                              >
                                {mt.teams?.abbreviation || 'Unknown'}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover">
                              <DropdownMenuItem onClick={() => setEditMeet(meet)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit Meet
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteMeet(meet.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateLeagueMeetModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={fetchMeets}
      />

      {editMeet && (
        <EditLeagueMeetSheet
          meet={editMeet}
          open={!!editMeet}
          onOpenChange={(open) => !open && setEditMeet(null)}
          onSuccess={fetchMeets}
        />
      )}
    </DashboardLayout>
  );
}
