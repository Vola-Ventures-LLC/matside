import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  FileEdit, 
  CheckCircle2, 
  Globe, 
  ArrowRight, 
  Loader2,
  History,
  ClipboardCheck,
  Copy,
  Check,
  BarChart3,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type PairingStatus = 'draft' | 'planned' | 'published';

interface PairingStatusBarProps {
  meetId: string;
  status: PairingStatus;
  isHost: boolean;
  matchCount: number;
  pendingApprovals: number;
  publicToken?: string | null;
  onStatusChange: () => void;
  onViewAudit: () => void;
  onViewApprovals: () => void;
  onViewSummary?: () => void;
}

const statusConfig: Record<PairingStatus, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  draft: {
    label: 'Draft',
    icon: <FileEdit className="w-4 h-4" />,
    color: 'bg-muted text-muted-foreground',
    description: 'Pairings can be freely edited. No audit trail.',
  },
  planned: {
    label: 'Planned',
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    description: 'Matchup call complete. Changes are now tracked.',
  },
  published: {
    label: 'Published',
    icon: <Globe className="w-4 h-4" />,
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    description: 'Pairings are public and ready for meet day.',
  },
};

export function PairingStatusBar({
  meetId,
  status,
  isHost,
  matchCount,
  pendingApprovals,
  publicToken,
  onStatusChange,
  onViewAudit,
  onViewApprovals,
  onViewSummary,
}: PairingStatusBarProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [confirmDialog, setConfirmDialog] = useState<'planned' | 'published' | null>(null);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentConfig = statusConfig[status];
  const canAdvance = isHost && matchCount > 0;

  const updateStatus = async (newStatus: PairingStatus) => {
    if (!user) return;
    setUpdating(true);

    try {
      // Update the meet status
      const { error: meetError } = await supabase
        .from('meets')
        .update({ pairing_status: newStatus })
        .eq('id', meetId);

      if (meetError) throw meetError;

      // If publishing, create a public token
      if (newStatus === 'published') {
        const { error: tokenError } = await supabase
          .from('public_meet_tokens')
          .upsert({
            meet_id: meetId,
            created_by: user.id,
          }, {
            onConflict: 'meet_id',
          });

        if (tokenError) throw tokenError;
      }

      toast({
        title: `Status updated to ${statusConfig[newStatus].label}`,
        description: newStatus === 'published' 
          ? 'A public link is now available to share.'
          : newStatus === 'planned'
          ? 'All changes will now be tracked in the audit log.'
          : undefined,
      });

      onStatusChange();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update status.',
      });
    } finally {
      setUpdating(false);
      setConfirmDialog(null);
    }
  };

  const copyPublicLink = () => {
    if (!publicToken) return;
    const url = `${window.location.origin}/public/meet/${publicToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Link copied!',
      description: 'Share this link with meet attendees.',
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Current Status Badge */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={`${currentConfig.color} gap-1.5 cursor-help`}>
            {currentConfig.icon}
            {currentConfig.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{currentConfig.description}</p>
        </TooltipContent>
      </Tooltip>

      {/* Audit Trail Button (visible when planned or published) */}
      {(status === 'planned' || status === 'published') && (
        <Button variant="ghost" size="sm" onClick={onViewAudit} className="gap-1.5">
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">Audit</span>
        </Button>
      )}

      {/* Changes Summary Button (visible when planned or published) */}
      {(status === 'planned' || status === 'published') && onViewSummary && (
        <Button variant="ghost" size="sm" onClick={onViewSummary} className="gap-1.5">
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">Summary</span>
        </Button>
      )}

      {/* Approval Queue Button (host only, when planned) */}
      {isHost && status === 'planned' && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onViewApprovals}
          className="gap-1.5"
        >
          <ClipboardCheck className="w-4 h-4" />
          <span className="hidden sm:inline">Approvals</span>
          {pendingApprovals > 0 && (
            <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {pendingApprovals}
            </Badge>
          )}
        </Button>
      )}

      {/* Public Link Button (when published) */}
      {status === 'published' && publicToken && (
        <Button variant="ghost" size="sm" onClick={copyPublicLink} className="gap-1.5">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Link'}</span>
        </Button>
      )}

      {/* Status Transition Buttons (host only) */}
      {canAdvance && status === 'draft' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setConfirmDialog('planned')}
          disabled={updating}
          className="gap-1.5"
        >
          {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          <span className="hidden sm:inline">Mark as Planned</span>
          <span className="sm:hidden">Plan</span>
        </Button>
      )}

      {canAdvance && status === 'planned' && (
        <Button
          size="sm"
          onClick={() => setConfirmDialog('published')}
          disabled={updating}
          className="gap-1.5"
        >
          {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
          <span className="hidden sm:inline">Publish</span>
          <span className="sm:hidden">Publish</span>
        </Button>
      )}

      {/* Confirmation Dialogs */}
      <AlertDialog open={confirmDialog === 'planned'} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark pairings as Planned?</AlertDialogTitle>
            <AlertDialogDescription>
              This indicates the matchup coordination call is complete. From this point forward:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All changes will be tracked in an audit log</li>
                <li>Team managers can scratch their wrestlers</li>
                <li>You'll need to approve replacement pairings</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => updateStatus('planned')}>
              Mark as Planned
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDialog === 'published'} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish pairings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Generate a public link to share with meet attendees</li>
                <li>Allow anyone with the link to view schedules</li>
                <li>Continue tracking changes in the audit log</li>
              </ul>
              <p className="mt-3 text-sm">
                You can still make changes after publishing.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => updateStatus('published')}>
              Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
