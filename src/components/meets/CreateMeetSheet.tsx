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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CreateMeetSheetProps {
  teamId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateMeetSheet({ teamId, open, onOpenChange, onSuccess }: CreateMeetSheetProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [teamDefaults, setTeamDefaults] = useState<{ home_meet_address: string | null; home_meet_notes: string | null } | null>(null);

  const [name, setName] = useState('');
  const [meetDate, setMeetDate] = useState<Date | undefined>(undefined);
  const [meetTime, setMeetTime] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [locationNotes, setLocationNotes] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      fetchTeamDefaults();
    } else {
      // Reset form on close
      setName('');
      setMeetDate(undefined);
      setMeetTime('');
      setLocationAddress('');
      setLocationNotes('');
      setNotes('');
    }
  }, [open, teamId]);

  const fetchTeamDefaults = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('home_meet_address, home_meet_notes')
      .eq('id', teamId)
      .single();

    if (!error && data) {
      setTeamDefaults(data);
      if (data.home_meet_address) setLocationAddress(data.home_meet_address);
      if (data.home_meet_notes) setLocationNotes(data.home_meet_notes);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !meetDate) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please provide a meet name and date.',
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('meets').insert({
      host_team_id: teamId,
      name: name.trim(),
      meet_date: format(meetDate, 'yyyy-MM-dd'),
      meet_time: meetTime || null,
      location_address: locationAddress.trim() || null,
      location_notes: locationNotes.trim() || null,
      notes: notes.trim() || null,
    });

    setLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create meet. Please try again.',
      });
    } else {
      toast({
        title: 'Meet created!',
        description: `${name.trim()} has been scheduled.`,
      });
      onOpenChange(false);
      onSuccess();
    }
  };

  const applyDefaults = () => {
    if (teamDefaults) {
      if (teamDefaults.home_meet_address) setLocationAddress(teamDefaults.home_meet_address);
      if (teamDefaults.home_meet_notes) setLocationNotes(teamDefaults.home_meet_notes);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Meet</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="meetName">Meet Name</Label>
            <Input
              id="meetName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 2024-02-15 WISS-PAN"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                    {meetDate ? format(meetDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={meetDate}
                    onSelect={setMeetDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meetTime">Start Time</Label>
              <Input
                id="meetTime"
                type="time"
                value={meetTime}
                onChange={(e) => setMeetTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="locationAddress">Location Address</Label>
              {teamDefaults?.home_meet_address && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="text-xs h-auto p-0"
                  onClick={applyDefaults}
                >
                  Use team defaults
                </Button>
              )}
            </div>
            <Input
              id="locationAddress"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              placeholder="e.g., 123 Main St, City, State"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationNotes">Location Notes</Label>
            <Textarea
              id="locationNotes"
              value={locationNotes}
              onChange={(e) => setLocationNotes(e.target.value)}
              placeholder="e.g., Enter through the gym doors on the south side"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Meet Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes for this meet..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Meet
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
