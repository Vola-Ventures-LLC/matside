import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface WrestlerChange {
  id: string;
  wrestler_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

interface WrestlerHistoryDialogProps {
  wrestlerId: string;
  wrestlerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fieldLabels: Record<string, string> = {
  weight: 'Weight',
  experience: 'Experience',
  skill: 'Skill',
  last_weigh_in_date: 'Weigh-in Date',
};

export function WrestlerHistoryDialog({
  wrestlerId,
  wrestlerName,
  open,
  onOpenChange,
}: WrestlerHistoryDialogProps) {
  const [changes, setChanges] = useState<WrestlerChange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && wrestlerId) {
      fetchHistory();
    }
  }, [open, wrestlerId]);

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wrestler_changes')
      .select('*')
      .eq('wrestler_id', wrestlerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wrestler history:', error);
    } else {
      setChanges(data || []);
    }
    setLoading(false);
  };

  const formatFieldValue = (fieldName: string, value: string | null): string => {
    if (value === null) return '—';
    if (fieldName === 'weight') return `${value} lbs`;
    if (fieldName === 'last_weigh_in_date') {
      try {
        return format(new Date(value), 'MMM d, yyyy');
      } catch {
        return value;
      }
    }
    return value;
  };

  const getFieldBadgeColor = (fieldName: string) => {
    switch (fieldName) {
      case 'weight':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'experience':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'skill':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'last_weigh_in_date':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Change History for {wrestlerName}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : changes.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No changes recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {changes.map((change) => (
                <div
                  key={change.id}
                  className="border border-border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge className={getFieldBadgeColor(change.field_name)}>
                      {fieldLabels[change.field_name] || change.field_name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(change.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground line-through">
                      {formatFieldValue(change.field_name, change.old_value)}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">
                      {formatFieldValue(change.field_name, change.new_value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
