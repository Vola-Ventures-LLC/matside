import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, FileText, Trophy, Building2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

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

interface MeetDetailsModalProps {
  meet: Meet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MeetDetailsModal({ meet, open, onOpenChange }: MeetDetailsModalProps) {
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

  const formatTime = (time: string | null) => {
    if (!time) return null;
    // time is in HH:MM:SS format, convert to readable format
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{meet.name}</span>
            {getStatusBadge(meet.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
              <div>
                <p className="text-sm text-muted-foreground">Hosted by</p>
                <p className="font-medium">{meet.host_team.name}</p>
              </div>
            </div>
          )}

          {/* League */}
          {meet.leagues && (
            <div className="flex items-start gap-3">
              <Trophy className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">League</p>
                <p className="font-medium">{meet.leagues.name}</p>
              </div>
            </div>
          )}

          {/* Location */}
          {(meet.location_address || meet.location_notes) && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                {meet.location_address && (
                  <p className="font-medium">{meet.location_address}</p>
                )}
                {meet.location_notes && (
                  <p className="text-sm text-muted-foreground mt-1">{meet.location_notes}</p>
                )}
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

          {/* No additional info message */}
          {!meet.meet_time && !meet.location_address && !meet.location_notes && !meet.notes && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No additional details available for this meet.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
