import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Flag, Trash2 } from 'lucide-react';

interface WrestlerFlagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetId: string;
  wrestlerId: string;
  wrestlerName: string;
  teamId: string;
  currentTeamId: string;
  existingFlag?: {
    id: string;
    note: string | null;
    team_id: string;
  } | null;
  onSuccess: () => void;
}

export function WrestlerFlagDialog({
  open,
  onOpenChange,
  meetId,
  wrestlerId,
  wrestlerName,
  teamId,
  currentTeamId,
  existingFlag,
  onSuccess,
}: WrestlerFlagDialogProps) {
  const { toast } = useToast();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwnTeam = teamId === currentTeamId;
  const canEdit = isOwnTeam || existingFlag?.team_id === currentTeamId;
  const isViewOnly = existingFlag && existingFlag.team_id !== currentTeamId;

  useEffect(() => {
    if (open) {
      setNote(existingFlag?.note || '');
    }
  }, [open, existingFlag]);

  const handleSave = async () => {
    if (!isOwnTeam) return;
    
    setSaving(true);
    try {
      if (existingFlag) {
        // Update existing flag
        const { error } = await supabase
          .from('wrestler_flags')
          .update({ note: note.trim() || null })
          .eq('id', existingFlag.id);

        if (error) throw error;

        toast({
          title: 'Flag updated',
          description: 'The discussion flag has been updated.',
        });
      } else {
        // Create new flag
        const { error } = await supabase
          .from('wrestler_flags')
          .insert({
            meet_id: meetId,
            wrestler_id: wrestlerId,
            team_id: currentTeamId,
            note: note.trim() || null,
          });

        if (error) throw error;

        toast({
          title: 'Wrestler flagged',
          description: 'This wrestler has been flagged for discussion.',
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save flag',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingFlag || existingFlag.team_id !== currentTeamId) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('wrestler_flags')
        .delete()
        .eq('id', existingFlag.id);

      if (error) throw error;

      toast({
        title: 'Flag removed',
        description: 'The discussion flag has been removed.',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to remove flag',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-yellow-500" />
            {existingFlag ? 'Discussion Flag' : 'Flag for Discussion'}
          </DialogTitle>
          <DialogDescription>
            {isViewOnly
              ? `Viewing flag for ${wrestlerName}`
              : existingFlag
              ? `Edit flag for ${wrestlerName}`
              : `Flag ${wrestlerName} to discuss at the matchup call`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              placeholder="Add context for the discussion..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isViewOnly}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {note.length}/500 characters
            </p>
          </div>

          {isViewOnly && (
            <p className="text-sm text-muted-foreground italic">
              Only the team that created this flag can edit or remove it.
            </p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {existingFlag && canEdit && (
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="text-destructive hover:text-destructive"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Remove Flag
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isViewOnly ? 'Close' : 'Cancel'}
          </Button>
          {!isViewOnly && (
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {existingFlag ? 'Update Flag' : 'Add Flag'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
