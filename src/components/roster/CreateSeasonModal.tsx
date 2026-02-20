import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Season } from '@/hooks/useSeasons';

interface CreateSeasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; start_date: string; end_date: string }) => Promise<Season | null>;
}

export function CreateSeasonModal({ open, onOpenChange, onSubmit }: CreateSeasonModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Default to current school year (Sep - Jun)
  const now = new Date();
  const currentYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const defaultName = `${currentYear}-${currentYear + 1}`;
  const defaultStart = `${currentYear}-09-01`;
  const defaultEnd = `${currentYear + 1}-06-30`;

  const [name, setName] = useState(defaultName);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !startDate || !endDate) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please fill in all fields.',
      });
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      toast({
        variant: 'destructive',
        title: 'Invalid dates',
        description: 'End date must be after start date.',
      });
      return;
    }

    setLoading(true);
    const result = await onSubmit({ name: name.trim(), start_date: startDate, end_date: endDate });
    setLoading(false);

    if (result) {
      toast({
        title: 'Season created',
        description: `${result.name} is now the active season.`,
      });
      onOpenChange(false);
      // Reset form for next use
      const nextYear = currentYear + 1;
      setName(`${nextYear}-${nextYear + 1}`);
      setStartDate(`${nextYear}-09-01`);
      setEndDate(`${nextYear + 1}-06-30`);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create season. Please try again.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Season</DialogTitle>
          <DialogDescription>
            Create a new season and set it as the current active season. Existing wrestlers will need to be added to this season.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seasonName">Season Name</Label>
            <Input
              id="seasonName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 2025-2026"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
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
            <Button type="submit" className="flex-1 btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Season'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
