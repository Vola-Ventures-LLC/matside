import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertTriangle,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
  MapPin,
  Clock,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

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

interface MeetCardProps {
  meet: Meet;
  teams: ParticipatingTeam[];
  isHost: boolean;
  isUpcoming: boolean;
  unconfirmedInfo: { hasWarning: boolean; count: number };
  onViewDetails: () => void;
  onManageAttendance: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function MeetCard({
  meet,
  teams,
  isHost,
  isUpcoming,
  unconfirmedInfo,
  onViewDetails,
  onManageAttendance,
  onEdit,
  onDelete,
}: MeetCardProps) {
  const navigate = useNavigate();

  const getContrastColor = (hexColor: string | null) => {
    if (!hexColor) return 'hsl(var(--foreground))';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary" className="text-xs">Draft</Badge>;
      case 'registration':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">Registration</Badge>;
      case 'live':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Live</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Completed</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      {/* Header: Date, Status, Actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-primary">
              {format(parseISO(meet.meet_date), 'EEE, MMM d')}
            </span>
            {meet.meet_time && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(meet.meet_time)}
              </span>
            )}
            {getStatusBadge(meet.status)}
          </div>
          <h3 className="font-semibold text-base mt-1 truncate">
            {meet.name}
            {isUpcoming && unconfirmedInfo.hasWarning && (
              <AlertTriangle className="w-4 h-4 text-yellow-500 inline ml-2" />
            )}
          </h3>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0 -mr-2">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            <DropdownMenuItem onClick={onViewDetails}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            {isUpcoming && (
              <DropdownMenuItem onClick={onManageAttendance}>
                <Users className="w-4 h-4 mr-2" />
                Manage Attendance
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => navigate(`/meets/${meet.id}/pairings`)}>
              Pairings
            </DropdownMenuItem>
            {isHost && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Meet
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Host & Location */}
      <div className="space-y-1 text-sm">
        {meet.host_team && (
          <div className="text-muted-foreground">
            Hosted by{' '}
            <span className="font-medium text-foreground">
              {meet.host_team.name}
              {isHost && <span className="text-primary ml-1">(You)</span>}
            </span>
          </div>
        )}
        {meet.location_address && (
          <div className="flex items-start gap-1.5 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span className="truncate">{meet.location_address}</span>
          </div>
        )}
      </div>

      {/* Teams */}
      {teams.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {teams.map((team) => (
            <Badge
              key={team.id}
              className="text-xs"
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
        </div>
      )}

      {/* Warning message */}
      {isUpcoming && unconfirmedInfo.hasWarning && (
        <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 rounded px-2 py-1.5">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{unconfirmedInfo.count} wrestler{unconfirmedInfo.count !== 1 ? 's' : ''} need confirmation</span>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs h-9"
          onClick={() => navigate(`/meets/${meet.id}/pairings`)}
        >
          Pairings
        </Button>
        {isUpcoming && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-9"
            onClick={onManageAttendance}
          >
            <Users className="w-3.5 h-3.5 mr-1.5" />
            Attendance
          </Button>
        )}
      </div>
    </div>
  );
}
