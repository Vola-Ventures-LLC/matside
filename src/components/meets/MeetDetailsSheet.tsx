import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, FileText, Building2, Trophy, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface Meet {
  id: string;
  name: string;
  meet_date: string;
  meet_time: string | null;
  status: string;
  location_address: string | null;
  location_notes: string | null;
  notes: string | null;
  host_team: {
    id: string;
    name: string;
    abbreviation: string;
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
  home_meet_address: string | null;
  home_meet_notes: string | null;
}

interface HostTeamDetails {
  home_meet_address: string | null;
  home_meet_notes: string | null;
  primary_color: string | null;
}

interface MeetDetailsSheetProps {
  meet: Meet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MeetDetailsSheet({ meet, open, onOpenChange }: MeetDetailsSheetProps) {
  const [participatingTeams, setParticipatingTeams] = useState<ParticipatingTeam[]>([]);
  const [hostTeamDetails, setHostTeamDetails] = useState<HostTeamDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && meet.id) {
      fetchDetails();
    }
  }, [open, meet.id]);

  const fetchDetails = async () => {
    setLoading(true);

    // Fetch participating teams from meet_teams
    const [teamsRes, hostRes] = await Promise.all([
      supabase
        .from('meet_teams')
        .select(`
          team_id,
          teams (
            id,
            name,
            abbreviation,
            primary_color,
            home_meet_address,
            home_meet_notes
          )
        `)
        .eq('meet_id', meet.id),
      meet.host_team?.id ? supabase
        .from('teams')
        .select('home_meet_address, home_meet_notes, primary_color')
        .eq('id', meet.host_team.id)
        .single() : null
    ]);

    if (!teamsRes.error && teamsRes.data) {
      const teams = teamsRes.data
        .filter(t => t.teams)
        .map(t => t.teams as ParticipatingTeam);
      setParticipatingTeams(teams);
    }

    if (hostRes && !hostRes.error && hostRes.data) {
      setHostTeamDetails(hostRes.data);
    }

    setLoading(false);
  };

  const formatTime = (time: string | null) => {
    if (!time) return null;
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
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
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle>{meet.name}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">
                {format(parseISO(meet.meet_date), 'EEEE, MMMM d, yyyy')}
              </p>
              {meet.meet_time && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="w-4 h-4" />
                  {formatTime(meet.meet_time)}
                </p>
              )}
            </div>
          </div>

          {/* Host Team */}
          {meet.host_team && (
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Hosted by</p>
                <div className="flex items-center gap-2 mt-1">
          {hostTeamDetails?.primary_color && (
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: hostTeamDetails.primary_color }}
                    />
                  )}
                  <p className="font-medium">{meet.host_team.name}</p>
                </div>
              </div>
            </div>
          )}

          {/* Meet Location */}
          {(meet.location_address || meet.location_notes) && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Meet Location</p>
                {meet.location_address && (
                  <p className="font-medium">{meet.location_address}</p>
                )}
                {meet.location_notes && (
                  <p className="text-sm text-muted-foreground mt-1">{meet.location_notes}</p>
                )}
              </div>
            </div>
          )}

          {/* Participating Teams */}
          {(participatingTeams.length > 0 || meet.host_team) && (
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">Teams</p>
                <div className="flex flex-wrap gap-2">
                  {/* Show host team first with star */}
                  {meet.host_team && hostTeamDetails && (
                    <Badge
                      style={{
                        backgroundColor: hostTeamDetails.primary_color || 'hsl(var(--muted))',
                        color: getContrastColor(hostTeamDetails.primary_color),
                        borderColor: hostTeamDetails.primary_color || 'hsl(var(--border))',
                      }}
                    >
                      {meet.host_team.abbreviation} ★
                    </Badge>
                  )}
                  {participatingTeams
                    .filter(team => team.id !== meet.host_team?.id)
                    .map((team) => (
                    <Badge
                      key={team.id}
                      style={{
                        backgroundColor: team.primary_color || 'hsl(var(--muted))',
                        color: getContrastColor(team.primary_color),
                        borderColor: team.primary_color || 'hsl(var(--border))',
                      }}
                    >
                      {team.abbreviation}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {meet.notes && (
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="whitespace-pre-wrap">{meet.notes}</p>
              </div>
            </div>
          )}

          {/* League - moved to bottom */}
          {meet.leagues && (
            <div className="flex items-start gap-3">
              <Trophy className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">League</p>
                <p className="font-medium">{meet.leagues.name}</p>
              </div>
            </div>
          )}

          {/* No additional info message */}
          {!meet.meet_time && !meet.location_address && !meet.location_notes && !meet.notes && participatingTeams.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No additional details available for this meet.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
