import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, UserX } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export interface ZeroMatchWrestler {
  id: string;
  name: string;
  reason: 'no_compatible_opponent' | 'rest_gap_conflict';
}

interface GenerationReportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchesCreated: number;
  wrestlersWithZeroMatches: ZeroMatchWrestler[];
}

const REASON_LABELS: Record<ZeroMatchWrestler['reason'], string> = {
  no_compatible_opponent: 'No compatible opponent',
  rest_gap_conflict: 'Scheduling conflict (rest gap)',
};

const REASON_DESCRIPTIONS: Record<ZeroMatchWrestler['reason'], string> = {
  no_compatible_opponent:
    'No eligible opponent was found based on age, weight, and other rules. Add them manually or adjust the rules.',
  rest_gap_conflict:
    'A match was selected but could not be placed on any mat without violating the minimum rest gap. Add manually via Add Match.',
};

export function GenerationReportSheet({
  open,
  onOpenChange,
  matchesCreated,
  wrestlersWithZeroMatches,
}: GenerationReportSheetProps) {
  const hasIssues = wrestlersWithZeroMatches.length > 0;

  // Group by reason
  const noOpponent = wrestlersWithZeroMatches.filter(w => w.reason === 'no_compatible_opponent');
  const restGap = wrestlersWithZeroMatches.filter(w => w.reason === 'rest_gap_conflict');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            {hasIssues ? (
              <AlertTriangle className="w-5 h-5 text-destructive" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
            Generation Report
          </SheetTitle>
          <SheetDescription>
            {matchesCreated} match{matchesCreated !== 1 ? 'es' : ''} created
            {hasIssues ? ` · ${wrestlersWithZeroMatches.length} wrestler${wrestlersWithZeroMatches.length !== 1 ? 's' : ''} unmatched` : ''}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          {!hasIssues ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <p className="text-sm text-muted-foreground">All attending wrestlers were matched successfully.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                The wrestlers below received no matches. Use{' '}
                <span className="font-medium">Add Match</span> to assign them manually.
              </p>

              {noOpponent.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <UserX className="w-4 h-4 text-destructive" />
                      No compatible opponent
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {REASON_DESCRIPTIONS.no_compatible_opponent}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {noOpponent.map(w => (
                      <div key={w.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                        <span className="text-sm font-medium">{w.name}</span>
                        <Badge variant="destructive" className="text-xs">No match</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {noOpponent.length > 0 && restGap.length > 0 && <Separator />}

              {restGap.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      Scheduling conflict
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {REASON_DESCRIPTIONS.rest_gap_conflict}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {restGap.map(w => (
                      <div key={w.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                        <span className="text-sm font-medium">{w.name}</span>
                        <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-400">Rest gap</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 pb-6 border-t pt-4">
          <Button className="w-full" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
