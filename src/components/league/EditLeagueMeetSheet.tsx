import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar as CalendarIcon, Loader2, Star } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
  meet_teams: MeetTeam[];
  teams: TeamInfo;
}

interface LeagueTeam {
  id: string;
  team_id: string;
  status: string;
  teams: TeamInfo;
}

interface EditLeagueMeetSheetProps {
  meet: LeagueMeet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditLeagueMeetSheet({ meet, open, onOpenChange, onSuccess }: EditLeagueMeetSheetProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [leagueTeams, setLeagueTeams] = useState<LeagueTeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  // Form state
  const [name, setName] = useState(meet.name);
  const [meetDate, setMeetDate] = useState<Date | undefined>(new Date(meet.meet_date + 'T00:00:00'));
  const [hostTeamId, setHostTeamId] = useState(meet.host_team_id);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      // Reset form with meet data
      setName(meet.name);
      setMeetDate(new Date(meet.meet_date + 'T00:00:00'));
      setHostTeamId(meet.host_team_id);
      
      // Set selected teams from meet_teams
      const teamIds = meet.meet_teams?.map(mt => mt.team_id) || [];
      setSelectedTeams(teamIds);
      
      fetchLeagueTeams();
    }
  }, [open, meet]);

  const fetchLeagueTeams = async () => {
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
      .eq('league_id', meet.league_id)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching league teams:', error);
    } else {
      setLeagueTeams((data as unknown as LeagueTeam[]) || []);
    }
    setTeamsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      // Update meet details
      const { error: meetError } = await supabase
        .from('meets')
        .update({
          name: name.trim(),
          meet_date: format(meetDate, 'yyyy-MM-dd'),
          host_team_id: hostTeamId,
        })
        .eq('id', meet.id);

      if (meetError) throw meetError;

      // Get current team IDs
      const currentTeamIds = meet.meet_teams?.map(mt => mt.team_id) || [];
      
      // Teams to add
      const teamsToAdd = selectedTeams.filter(id => !currentTeamIds.includes(id));
      
      // Teams to remove
      const teamsToRemove = currentTeamIds.filter(id => !selectedTeams.includes(id));

      // Remove teams
      if (teamsToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('meet_teams')
          .delete()
          .eq('meet_id', meet.id)
          .in('team_id', teamsToRemove);

        if (removeError) throw removeError;
      }

      // Add new teams
      if (teamsToAdd.length > 0) {
        const teamInserts = teamsToAdd.map((teamId) => ({
          meet_id: meet.id,
          team_id: teamId,
          status: teamId === hostTeamId ? 'confirmed' : 'invited',
        }));

        const { error: addError } = await supabase
          .from('meet_teams')
          .insert(teamInserts);

        if (addError) throw addError;
      }

      // Update host team status to confirmed if changed
      const { error: hostUpdateError } = await supabase
        .from('meet_teams')
        .update({ status: 'confirmed' })
        .eq('meet_id', meet.id)
        .eq('team_id', hostTeamId);

      if (hostUpdateError) throw hostUpdateError;

      toast({
        title: 'Meet Updated',
        description: 'The meet has been updated successfully',
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error updating meet:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update meet',
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

  // Auto-select host team when changed
  useEffect(() => {
    if (hostTeamId && !selectedTeams.includes(hostTeamId)) {
      setSelectedTeams((prev) => [...prev, hostTeamId]);
    }
  }, [hostTeamId]);

  const activeTeams = leagueTeams.filter((lt) => lt.teams);

  const getContrastColor = (hexColor: string) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Meet</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Meet Details Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Meet Details
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Meet Name</Label>
              <Input
                id="name"
                placeholder="e.g., Week 1 - Home Opener"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

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
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
                  <Calendar
                    mode="single"
                    selected={meetDate}
                    onSelect={setMeetDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Separator />

          {/* Teams Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Teams
            </h3>

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
                  <SelectContent className="bg-popover">
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
                <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto bg-background">
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
                      <Badge
                        style={{
                          backgroundColor: lt.teams.primary_color,
                          color: getContrastColor(lt.teams.primary_color),
                        }}
                        className="flex items-center gap-1"
                      >
                        {lt.team_id === hostTeamId && <Star className="w-3 h-3 fill-current" />}
                        {lt.teams.abbreviation}
                      </Badge>
                      <span className="text-sm flex-1">{lt.teams.name}</span>
                    </label>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {selectedTeams.length} team{selectedTeams.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
