import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserContext } from '@/contexts/UserContext';
import { useLeagueSeasons } from '@/hooks/useLeagueSeasons';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
interface CreateLeagueMeetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface LeagueTeam {
  id: string;
  team_id: string;
  status: string;
  teams: {
    id: string;
    name: string;
    abbreviation: string;
    primary_color: string;
  };
}

export function CreateLeagueMeetModal({ open, onOpenChange, onSuccess }: CreateLeagueMeetModalProps) {
  const { currentContext } = useUserContext();
  const { toast } = useToast();
  const leagueId = currentContext?.type === 'league' ? currentContext.id : undefined;
  const { currentSeason } = useLeagueSeasons(leagueId);
  const [loading, setLoading] = useState(false);
  const [leagueTeams, setLeagueTeams] = useState<LeagueTeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  // Form state
  const [name, setName] = useState('');
  const [meetDate, setMeetDate] = useState<Date | undefined>(undefined);
  const [hostTeamId, setHostTeamId] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  useEffect(() => {
    if (open && currentContext?.type === 'league') {
      fetchLeagueTeams();
    }
  }, [open, currentContext]);

  const fetchLeagueTeams = async () => {
    if (!currentContext || currentContext.type !== 'league') return;

    setTeamsLoading(true);
    const { data, error } = await supabase
      .from('league_teams')
      .select(`
        id,
        team_id,
        status,
        teams (
          id,
          name,
          abbreviation,
          primary_color
        )
      `)
      .eq('league_id', currentContext.id)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching league teams:', error);
    } else {
      setLeagueTeams((data as unknown as LeagueTeam[]) || []);
    }
    setTeamsLoading(false);
  };

  const resetForm = () => {
    setName('');
    setMeetDate(undefined);
    setHostTeamId('');
    setSelectedTeams([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentContext || currentContext.type !== 'league') return;

    if (!name.trim()) {
      toast({ title: 'Error', description: 'Please enter a meet name', variant: 'destructive' });
      return;
    }

    if (!meetDate) {
      toast({ title: 'Error', description: 'Please select a date', variant: 'destructive' });
      return;
    }

    if (!hostTeamId) {
      toast({ title: 'Error', description: 'Please select a host team', variant: 'destructive' });
      return;
    }

    if (selectedTeams.length < 2) {
      toast({ title: 'Error', description: 'Please select at least 2 participating teams', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      // Create the meet (mat count is derived from mat_rules at runtime)
      const { data: meet, error: meetError } = await supabase
        .from('meets')
        .insert({
          name: name.trim(),
          meet_date: format(meetDate, 'yyyy-MM-dd'),
          host_team_id: hostTeamId,
          league_id: currentContext.id,
          season_id: currentSeason?.id || null,
          status: 'draft',
        })
        .select()
        .single();

      if (meetError) throw meetError;

      // Add participating teams
      const teamInserts = selectedTeams.map((teamId) => ({
        meet_id: meet.id,
        team_id: teamId,
        status: teamId === hostTeamId ? 'confirmed' : 'invited',
      }));

      const { error: teamsError } = await supabase
        .from('meet_teams')
        .insert(teamInserts);

      if (teamsError) throw teamsError;

      toast({
        title: 'Meet Scheduled',
        description: `${name} has been added to the schedule`,
      });

      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating meet:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create meet',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTeamSelection = (teamId: string) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  };

  // Auto-select host team when chosen
  useEffect(() => {
    if (hostTeamId && !selectedTeams.includes(hostTeamId)) {
      setSelectedTeams((prev) => [...prev, hostTeamId]);
    }
  }, [hostTeamId]);

  const activeTeams = leagueTeams.filter((lt) => lt.teams);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule a Meet</DialogTitle>
          <DialogDescription>
            Create a new meet and select participating teams from the league.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Meet Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Meet Name</Label>
            <Input
              id="name"
              placeholder="e.g., Week 1 - Home Opener"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !meetDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {meetDate ? format(meetDate, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={meetDate}
                  onSelect={setMeetDate}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Host Team */}
          <div className="space-y-2">
            <Label>Host Team</Label>
            {teamsLoading ? (
              <p className="text-sm text-muted-foreground">Loading teams...</p>
            ) : activeTeams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active teams in the league</p>
            ) : (
              <Select value={hostTeamId} onValueChange={setHostTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select host team" />
                </SelectTrigger>
                <SelectContent>
                  {activeTeams.map((lt) => (
                    <SelectItem key={lt.team_id} value={lt.team_id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: lt.teams.primary_color }}
                        />
                        {lt.teams.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>


          {/* Participating Teams */}
          <div className="space-y-2">
            <Label>Participating Teams</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Select at least 2 teams (host is automatically included)
            </p>
            {teamsLoading ? (
              <p className="text-sm text-muted-foreground">Loading teams...</p>
            ) : activeTeams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active teams in the league</p>
            ) : (
              <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                {activeTeams.map((lt) => (
                  <label
                    key={lt.team_id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedTeams.includes(lt.team_id)}
                      onCheckedChange={() => toggleTeamSelection(lt.team_id)}
                      disabled={lt.team_id === hostTeamId}
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: lt.teams.primary_color }}
                    />
                    <span className="text-sm">
                      {lt.teams.name}
                      {lt.team_id === hostTeamId && (
                        <span className="text-xs text-muted-foreground ml-2">(Host)</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {selectedTeams.length} team{selectedTeams.length !== 1 ? 's' : ''} selected
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || activeTeams.length < 2}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Schedule Meet'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
