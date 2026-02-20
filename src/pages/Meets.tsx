import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTeam } from '@/contexts/TeamContext';
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  CalendarCheck, 
  Calendar, 
  Users, 
  History, 
  AlertTriangle, 
  Eye, 
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ManageAttendanceSheet } from '@/components/meets/ManageAttendanceSheet';
import { MeetDetailsSheet } from '@/components/meets/MeetDetailsSheet';
import { EditMeetSheet } from '@/components/meets/EditMeetSheet';
import { MeetCard } from '@/components/meets/MeetCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface Meet {
  id: string;
  name: string;
  meet_date: string;
  meet_time: string | null;
  status: string;
  host_team_id: string;
  league_id: string | null;
  location_address: string | null;
  location_notes: string | null;
  notes: string | null;
  host_team: {
    id: string;
    name: string;
    abbreviation: string;
    primary_color: string | null;
  } | null;
  leagues: {
    id: string;
    name: string;
    abbreviation: string;
  } | null;
}

interface ParticipatingTeam {
  id: string;
  name: string;
  abbreviation: string;
  primary_color: string | null;
  isHost?: boolean;
}

interface AttendanceCount {
  meet_id: string;
  unconfirmed_count: number;
  pending_count: number;
}

export default function Meets() {
  const navigate = useNavigate();
  const { currentTeam } = useTeam();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [meets, setMeets] = useState<Meet[]>([]);
  const [meetTeams, setMeetTeams] = useState<Record<string, ParticipatingTeam[]>>({});
  const [attendanceCounts, setAttendanceCounts] = useState<Record<string, AttendanceCount>>({});
  const [wrestlerCount, setWrestlerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [attendanceMeet, setAttendanceMeet] = useState<Meet | null>(null);
  const [detailsMeet, setDetailsMeet] = useState<Meet | null>(null);
  const [editingMeet, setEditingMeet] = useState<Meet | null>(null);

  const getContrastColor = (hexColor: string | null) => {
    if (!hexColor) return 'hsl(var(--foreground))';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  useEffect(() => {
    if (currentTeam) {
      fetchData();
    }
  }, [currentTeam]);

  const fetchData = async () => {
    if (!currentTeam) return;

    setLoading(true);

    const [meetsRes, attendanceRes, wrestlersRes] = await Promise.all([
      supabase
        .from('meets')
        .select(`
          id,
          name,
          meet_date,
          meet_time,
          status,
          host_team_id,
          league_id,
          location_address,
          location_notes,
          notes,
          host_team:teams!meets_host_team_id_fkey (
            id,
            name,
            abbreviation,
            primary_color
          ),
          leagues (
            id,
            name,
            abbreviation
          )
        `)
        .order('meet_date', { ascending: true }),
      supabase
        .from('meet_attendance')
        .select('meet_id, status')
        .eq('team_id', currentTeam.id),
      supabase
        .from('wrestlers')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', currentTeam.id)
        .eq('status', 'active')
    ]);

    if (meetsRes.error) {
      console.error('Error fetching meets:', meetsRes.error);
      toast({
        title: 'Error',
        description: 'Failed to load meets',
        variant: 'destructive',
      });
      setMeets([]);
    } else {
      const meetsData = (meetsRes.data as unknown as Meet[]) || [];
      setMeets(meetsData);
      
      // Fetch participating teams for all meets
      if (meetsData.length > 0) {
        const meetIds = meetsData.map(m => m.id);
        const teamsRes = await supabase
          .from('meet_teams')
          .select(`
            meet_id,
            teams (
              id,
              name,
              abbreviation,
              primary_color
            )
          `)
          .in('meet_id', meetIds);
        
        if (!teamsRes.error && teamsRes.data) {
          const teamsMap: Record<string, ParticipatingTeam[]> = {};
          teamsRes.data.forEach((mt: any) => {
            if (mt.teams) {
              if (!teamsMap[mt.meet_id]) {
                teamsMap[mt.meet_id] = [];
              }
              teamsMap[mt.meet_id].push(mt.teams as ParticipatingTeam);
            }
          });
          
          // Add host teams to the teams map (they may not be in meet_teams)
          meetsData.forEach((meet) => {
            if (meet.host_team) {
              if (!teamsMap[meet.id]) {
                teamsMap[meet.id] = [];
              }
              // Check if host is already in the list
              const hostAlreadyInList = teamsMap[meet.id].some(t => t.id === meet.host_team!.id);
              if (!hostAlreadyInList) {
                teamsMap[meet.id].unshift({
                  ...meet.host_team,
                  isHost: true,
                });
              } else {
                // Mark existing entry as host
                const hostIndex = teamsMap[meet.id].findIndex(t => t.id === meet.host_team!.id);
                if (hostIndex !== -1) {
                  teamsMap[meet.id][hostIndex].isHost = true;
                  // Move host to front
                  const [hostTeam] = teamsMap[meet.id].splice(hostIndex, 1);
                  teamsMap[meet.id].unshift(hostTeam);
                }
              }
            }
          });
          
          setMeetTeams(teamsMap);
        }
      }
    }

    if (!attendanceRes.error && attendanceRes.data) {
      const counts: Record<string, AttendanceCount> = {};
      attendanceRes.data.forEach((a) => {
        if (!counts[a.meet_id]) {
          counts[a.meet_id] = { meet_id: a.meet_id, unconfirmed_count: 0, pending_count: 0 };
        }
        if (a.status === 'unconfirmed') {
          counts[a.meet_id].unconfirmed_count++;
        } else if (a.status === 'pending') {
          counts[a.meet_id].pending_count++;
        }
      });
      setAttendanceCounts(counts);
    }

    if (!wrestlersRes.error) {
      setWrestlerCount(wrestlersRes.count || 0);
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
        description: 'The meet has been removed',
      });
      fetchData();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'registration':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Registration</Badge>;
      case 'live':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Live</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isHostTeam = (meet: Meet): boolean => {
    return currentTeam?.id === meet.host_team_id;
  };

  const hasUnconfirmedWrestlers = (meetId: string): { hasWarning: boolean; count: number } => {
    const counts = attendanceCounts[meetId];
    const unconfirmedCount = counts?.unconfirmed_count || 0;
    const pendingCount = counts?.pending_count || 0;
    
    const attendanceRecordsForMeet = Object.keys(attendanceCounts).includes(meetId);
    const totalUnconfirmed = unconfirmedCount + pendingCount;
    
    return {
      hasWarning: totalUnconfirmed > 0 || (wrestlerCount > 0 && !attendanceRecordsForMeet),
      count: totalUnconfirmed > 0 ? totalUnconfirmed : wrestlerCount
    };
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingMeets = meets.filter(meet => {
    const meetDate = parseISO(meet.meet_date);
    return meetDate >= today;
  });

  const pastMeets = meets.filter(meet => {
    const meetDate = parseISO(meet.meet_date);
    return meetDate < today;
  }).reverse();

  const renderMeetsCards = (meetsList: Meet[], isUpcoming: boolean) => (
    <div className="space-y-3">
      {meetsList.map((meet) => {
        const unconfirmedInfo = isUpcoming ? hasUnconfirmedWrestlers(meet.id) : { hasWarning: false, count: 0 };
        const teams = meetTeams[meet.id] || [];
        const isHost = isHostTeam(meet);

        return (
          <MeetCard
            key={meet.id}
            meet={meet}
            teams={teams}
            isHost={isHost}
            isUpcoming={isUpcoming}
            unconfirmedInfo={unconfirmedInfo}
            onViewDetails={() => setDetailsMeet(meet)}
            onManageAttendance={() => setAttendanceMeet(meet)}
            onEdit={() => setEditingMeet(meet)}
            onDelete={() => deleteMeet(meet.id)}
          />
        );
      })}
    </div>
  );

  const renderMeetsTable = (meetsList: Meet[], isUpcoming: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Host</TableHead>
          <TableHead>Teams</TableHead>
          <TableHead className="w-[280px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {meetsList.map((meet) => {
          const unconfirmedInfo = isUpcoming ? hasUnconfirmedWrestlers(meet.id) : { hasWarning: false, count: 0 };
          const teams = meetTeams[meet.id] || [];
          const isHost = isHostTeam(meet);
          
          return (
            <TableRow key={meet.id}>
              <TableCell className="font-medium">
                {format(parseISO(meet.meet_date), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {meet.name}
                  {isUpcoming && unconfirmedInfo.hasWarning && (
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{unconfirmedInfo.count} wrestler{unconfirmedInfo.count !== 1 ? 's' : ''} need attendance confirmation</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {meet.host_team ? (
                  <span className="font-medium">
                    {meet.host_team.name}
                    {isHost && <span className="text-primary ml-1">(You)</span>}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {teams.map((team) => (
                    <Badge
                      key={team.id}
                      style={{
                        backgroundColor: team.primary_color || 'hsl(var(--muted))',
                        color: getContrastColor(team.primary_color),
                        borderColor: team.primary_color || 'hsl(var(--border))',
                      }}
                    >
                      {team.abbreviation}
                      {team.isHost && ' ★'}
                    </Badge>
                  ))}
                  {teams.length === 0 && (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {/* Details - everyone can view */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDetailsMeet(meet)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Details
                  </Button>
                  
                  {/* Attendance - everyone can manage their own */}
                  {isUpcoming && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAttendanceMeet(meet)}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Attendance
                    </Button>
                  )}
                  
                  {/* Pairings - everyone can view */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/meets/${meet.id}/pairings`)}
                  >
                    Pairings
                  </Button>
                  
                  {/* Host-only actions in dropdown */}
                  {isHost && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={() => setEditingMeet(meet)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteMeet(meet.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  const renderMeets = (meetsList: Meet[], isUpcoming: boolean) => {
    if (isMobile) {
      return renderMeetsCards(meetsList, isUpcoming);
    }
    return renderMeetsTable(meetsList, isUpcoming);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Meets</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              View meets, manage attendance, and coordinate pairings
            </p>
          </div>
          <Button className="btn-primary w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create Meet
          </Button>
        </div>

        {/* Upcoming Meets */}
        <Card className="card-athletic">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <CalendarCheck className="w-5 h-5" />
              Upcoming Meets
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            {loading ? (
              <div className="flex items-center justify-center py-8 md:py-12">
                <p className="text-muted-foreground text-sm md:text-base">Loading meets...</p>
              </div>
            ) : upcomingMeets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
                <Calendar className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mb-3 md:mb-4" />
                <p className="text-sm md:text-base text-muted-foreground">
                  No upcoming meets scheduled
                </p>
              </div>
            ) : (
              renderMeets(upcomingMeets, true)
            )}
          </CardContent>
        </Card>

        {/* Past Meets */}
        {!loading && pastMeets.length > 0 && (
          <Card className="card-athletic">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <History className="w-5 h-5" />
                Past Meets
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              {renderMeets(pastMeets, false)}
            </CardContent>
          </Card>
        )}
      </div>

      {attendanceMeet && currentTeam && (
        <ManageAttendanceSheet
          meet={attendanceMeet}
          teamId={currentTeam.id}
          open={!!attendanceMeet}
          onOpenChange={(open) => {
            if (!open) {
              setAttendanceMeet(null);
              fetchData();
            }
          }}
        />
      )}

      {detailsMeet && (
        <MeetDetailsSheet
          meet={detailsMeet}
          open={!!detailsMeet}
          onOpenChange={(open) => !open && setDetailsMeet(null)}
        />
      )}

      {editingMeet && currentTeam && (
        <EditMeetSheet
          meet={editingMeet}
          teamId={currentTeam.id}
          open={!!editingMeet}
          onOpenChange={(open) => !open && setEditingMeet(null)}
          onSuccess={fetchData}
        />
      )}
    </DashboardLayout>
  );
}
