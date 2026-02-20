import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Meet {
  id: string;
  name: string;
  meet_date: string;
  meet_time: string | null;
  status: string;
  league_id: string | null;
  location_address: string | null;
  location_notes: string | null;
  notes: string | null;
}

interface EditMeetModalProps {
  meet: Meet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditMeetModal({ meet, open, onOpenChange, onSuccess }: EditMeetModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState(meet.name);
  const [meetDate, setMeetDate] = useState<Date | undefined>(new Date(meet.meet_date));
  const [meetTime, setMeetTime] = useState(meet.meet_time || '');
  const [locationAddress, setLocationAddress] = useState(meet.location_address || '');
  const [locationNotes, setLocationNotes] = useState(meet.location_notes || '');
  const [notes, setNotes] = useState(meet.notes || '');

  useEffect(() => {
    setName(meet.name);
    setMeetDate(new Date(meet.meet_date));
    setMeetTime(meet.meet_time || '');
    setLocationAddress(meet.location_address || '');
    setLocationNotes(meet.location_notes || '');
    setNotes(meet.notes || '');
  }, [meet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !meetDate) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('meets')
      .update({
        name: name.trim(),
        meet_date: format(meetDate, 'yyyy-MM-dd'),
        meet_time: meetTime || null,
        location_address: locationAddress.trim() || null,
        location_notes: locationNotes.trim() || null,
        notes: notes.trim() || null,
      })
      .eq('id', meet.id);

    setLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update meet. Please try again.',
      });
    } else {
      toast({
        title: 'Meet updated!',
        description: `${name} has been updated.`,
      });
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Meet</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meetName">Meet Name</Label>
              <Input
                id="meetName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., 2024-02-15 WISS-PAN"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Meet Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !meetDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {meetDate ? format(meetDate, "MMM d, yyyy") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={meetDate}
                      onSelect={setMeetDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
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
              <Label htmlFor="locationAddress">Location Address</Label>
              <Input
                id="locationAddress"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="e.g., 123 Main St, City, State 12345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationNotes">Location Notes</Label>
              <Textarea
                id="locationNotes"
                value={locationNotes}
                onChange={(e) => setLocationNotes(e.target.value)}
                placeholder="Parking info, entrance details, etc."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Meet Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information for teams..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}