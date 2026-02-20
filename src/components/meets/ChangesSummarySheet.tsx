import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserX, ArrowRightLeft, Plus, Minus, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TeamSummary {
  team_id: string;
  team_name: string;
  team_abbreviation: string;
  team_color: string | null;
  counts: {
    scratch: number;
    match_changed: number;
    match_added: number;
    match_removed: number;
    approved: number;
    rejected: number;
  };
  total: number;
}

interface ChangesSummarySheetProps {
  meetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const actionLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  scratch: { label: 'Scratches', icon: <UserX className="w-4 h-4" />, color: 'text-red-400' },
  match_changed: { label: 'Changes', icon: <ArrowRightLeft className="w-4 h-4" />, color: 'text-yellow-400' },
  match_added: { label: 'Added', icon: <Plus className="w-4 h-4" />, color: 'text-green-400' },
  match_removed: { label: 'Removed', icon: <Minus className="w-4 h-4" />, color: 'text-red-400' },
  approved: { label: 'Approved', icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-400' },
  rejected: { label: 'Rejected', icon: <XCircle className="w-4 h-4" />, color: 'text-red-400' },
};

export function ChangesSummarySheet({
  meetId,
  open,
  onOpenChange,
}: ChangesSummarySheetProps) {
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<TeamSummary[]>([]);

  useEffect(() => {
    if (open) {
      fetchSummary();
    }
  }, [open, meetId]);

  const fetchSummary = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('pairing_audit')
      .select('team_id, action')
      .eq('meet_id', meetId);

    if (error) {
      console.error('Error fetching audit summary:', error);
      setLoading(false);
      return;
    }

    // Group by team and count actions
    const teamCounts = new Map<string, TeamSummary['counts']>();
    const teamIds = new Set<string>();

    data.forEach(entry => {
      teamIds.add(entry.team_id);
      
      if (!teamCounts.has(entry.team_id)) {
        teamCounts.set(entry.team_id, {
          scratch: 0,
          match_changed: 0,
          match_added: 0,
          match_removed: 0,
          approved: 0,
          rejected: 0,
        });
      }
      
      const counts = teamCounts.get(entry.team_id)!;
      if (entry.action in counts) {
        counts[entry.action as keyof typeof counts]++;
      }
    });

    // Fetch team info
    const { data: teamsData } = await supabase
      .from('teams')
      .select('id, name, abbreviation, primary_color')
      .in('id', Array.from(teamIds));

    const teamMap = new Map(teamsData?.map(t => [t.id, t]) || []);

    // Build summaries
    const result: TeamSummary[] = Array.from(teamCounts.entries()).map(([teamId, counts]) => {
      const team = teamMap.get(teamId);
      const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
      
      return {
        team_id: teamId,
        team_name: team?.name || 'Unknown Team',
        team_abbreviation: team?.abbreviation || '???',
        team_color: team?.primary_color || null,
        counts,
        total,
      };
    });

    // Sort by total changes descending
    result.sort((a, b) => b.total - a.total);

    setSummaries(result);
    setLoading(false);
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
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Changes Summary</SheetTitle>
        </SheetHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : summaries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No changes recorded yet.</p>
              <p className="text-sm mt-1">Changes are tracked after the status is set to "Planned".</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-150px)]">
              <div className="space-y-4 pr-4">
                {summaries.map(summary => (
                  <Card key={summary.team_id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Badge
                            className="text-xs"
                            style={{
                              backgroundColor: summary.team_color || 'hsl(var(--muted))',
                              color: getContrastColor(summary.team_color),
                            }}
                          >
                            {summary.team_abbreviation}
                          </Badge>
                          <span>{summary.team_name}</span>
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {summary.total} total
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(summary.counts)
                          .filter(([_, count]) => count > 0)
                          .map(([action, count]) => {
                            const config = actionLabels[action];
                            return (
                              <div
                                key={action}
                                className="flex items-center gap-2 text-sm"
                              >
                                <span className={config.color}>{config.icon}</span>
                                <span className="text-muted-foreground">{config.label}:</span>
                                <span className="font-medium">{count}</span>
                              </div>
                            );
                          })}
                      </div>
                      {Object.values(summary.counts).every(c => c === 0) && (
                        <p className="text-sm text-muted-foreground">No changes recorded</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
