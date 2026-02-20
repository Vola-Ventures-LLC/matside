import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Check,
  X,
  UserX,
  ArrowRight,
  Users,
  Search,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, differenceInYears } from 'date-fns';

interface ScratchSuggestion {
  id: string;
  meet_id: string;
  original_match_id: string;
  scratched_wrestler_id: string;
  remaining_wrestler_id: string;
  suggested_opponent_id: string | null;
  suggested_by: string;
  status: string;
  notes: string | null;
  created_at: string;
  // Enriched data
  scratched_wrestler?: WrestlerInfo;
  remaining_wrestler?: WrestlerInfo;
  suggested_opponent?: WrestlerInfo;
  suggested_by_name?: string;
}

interface WrestlerInfo {
  id: string;
  first_name: string;
  last_name: string;
  weight: number;
  date_of_birth: string;
  experience: number;
  skill: number;
  team_id: string;
  team_abbreviation?: string;
  team_color?: string;
  match_count?: number;
}

interface ApprovalQueueSheetProps {
  meetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprovalComplete: () => void;
}

export function ApprovalQueueSheet({
  meetId,
  open,
  onOpenChange,
  onApprovalComplete,
}: ApprovalQueueSheetProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ScratchSuggestion[]>([]);
  const [selectingOpponent, setSelectingOpponent] = useState<string | null>(null);
  const [availableOpponents, setAvailableOpponents] = useState<WrestlerInfo[]>([]);

  useEffect(() => {
    if (open) {
      fetchSuggestions();
    }
  }, [open, meetId]);

  const fetchSuggestions = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('scratch_suggestions')
      .select('*')
      .eq('meet_id', meetId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching suggestions:', error);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    // Gather all wrestler IDs we need to fetch
    const wrestlerIds = new Set<string>();
    data.forEach(s => {
      wrestlerIds.add(s.scratched_wrestler_id);
      wrestlerIds.add(s.remaining_wrestler_id);
      if (s.suggested_opponent_id) wrestlerIds.add(s.suggested_opponent_id);
    });

    const userIds = [...new Set(data.map(s => s.suggested_by))];

    const [wrestlersRes, profilesRes, matchesRes] = await Promise.all([
      supabase.from('wrestlers').select('id, first_name, last_name, weight, date_of_birth, experience, skill, team_id').in('id', [...wrestlerIds]),
      supabase.from('profiles').select('user_id, full_name').in('user_id', userIds),
      supabase.from('matches').select('id, wrestler_a_id, wrestler_b_id').eq('meet_id', meetId),
    ]);

    // Get team info
    const teamIds = [...new Set(wrestlersRes.data?.map(w => w.team_id) || [])];
    const { data: teamsData } = await supabase.from('teams').select('id, abbreviation, primary_color').in('id', teamIds);

    const teamMap = new Map(teamsData?.map(t => [t.id, t]) || []);

    // Count matches per wrestler
    const matchCounts: Record<string, number> = {};
    matchesRes.data?.forEach(m => {
      matchCounts[m.wrestler_a_id] = (matchCounts[m.wrestler_a_id] || 0) + 1;
      matchCounts[m.wrestler_b_id] = (matchCounts[m.wrestler_b_id] || 0) + 1;
    });

    const wrestlerMap = new Map(
      wrestlersRes.data?.map(w => {
        const team = teamMap.get(w.team_id);
        return [w.id, {
          ...w,
          team_abbreviation: team?.abbreviation,
          team_color: team?.primary_color,
          match_count: matchCounts[w.id] || 0,
        }];
      }) || []
    );

    const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p.full_name]) || []);

    const enriched: ScratchSuggestion[] = data.map(s => ({
      ...s,
      scratched_wrestler: wrestlerMap.get(s.scratched_wrestler_id),
      remaining_wrestler: wrestlerMap.get(s.remaining_wrestler_id),
      suggested_opponent: s.suggested_opponent_id ? wrestlerMap.get(s.suggested_opponent_id) : undefined,
      suggested_by_name: profileMap.get(s.suggested_by) || 'Unknown',
    }));

    setSuggestions(enriched);
    setLoading(false);
  };

  const handleApprove = async (suggestion: ScratchSuggestion) => {
    if (!user || !suggestion.suggested_opponent_id) return;
    setProcessing(suggestion.id);

    try {
      // Update the match with the new opponent
      const { error: matchError } = await supabase
        .from('matches')
        .update({
          wrestler_a_id: suggestion.remaining_wrestler_id,
          wrestler_b_id: suggestion.suggested_opponent_id,
        })
        .eq('id', suggestion.original_match_id);

      if (matchError) throw matchError;

      // Mark suggestion as approved
      const { error: suggestionError } = await supabase
        .from('scratch_suggestions')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', suggestion.id);

      if (suggestionError) throw suggestionError;

      // Add audit entry
      await supabase.from('pairing_audit').insert({
        meet_id: meetId,
        team_id: suggestion.remaining_wrestler?.team_id || suggestion.scratched_wrestler?.team_id || '',
        wrestler_id: suggestion.suggested_opponent_id,
        match_id: suggestion.original_match_id,
        changed_by: user.id,
        action: 'approved',
        old_value: { wrestler_id: suggestion.scratched_wrestler_id },
        new_value: { wrestler_id: suggestion.suggested_opponent_id },
        description: `Approved replacement: ${suggestion.suggested_opponent?.first_name} ${suggestion.suggested_opponent?.last_name} for ${suggestion.scratched_wrestler?.first_name} ${suggestion.scratched_wrestler?.last_name}`,
      });

      toast({ title: 'Replacement approved' });
      fetchSuggestions();
      onApprovalComplete();
    } catch (error: any) {
      console.error('Error approving suggestion:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (suggestion: ScratchSuggestion) => {
    if (!user) return;
    setProcessing(suggestion.id);

    try {
      // Delete the original match
      const { error: matchError } = await supabase
        .from('matches')
        .delete()
        .eq('id', suggestion.original_match_id);

      if (matchError) throw matchError;

      // Mark suggestion as rejected
      const { error: suggestionError } = await supabase
        .from('scratch_suggestions')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', suggestion.id);

      if (suggestionError) throw suggestionError;

      // Add audit entry
      await supabase.from('pairing_audit').insert({
        meet_id: meetId,
        team_id: suggestion.remaining_wrestler?.team_id || suggestion.scratched_wrestler?.team_id || '',
        match_id: suggestion.original_match_id,
        changed_by: user.id,
        action: 'rejected',
        description: `Rejected replacement for ${suggestion.scratched_wrestler?.first_name} ${suggestion.scratched_wrestler?.last_name} - match removed`,
      });

      toast({ title: 'Match removed (no replacement)' });
      fetchSuggestions();
      onApprovalComplete();
    } catch (error: any) {
      console.error('Error rejecting suggestion:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setProcessing(null);
    }
  };

  const getAge = (dob: string) => differenceInYears(new Date(), parseISO(dob));

  const getContrastColor = (hexColor: string | null | undefined) => {
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
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Pending Approvals</SheetTitle>
        </SheetHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pending approvals</p>
              <p className="text-sm mt-1">When team managers scratch wrestlers, replacements will appear here.</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-180px)]">
              <div className="space-y-4 pr-4">
                {suggestions.map(suggestion => (
                  <div
                    key={suggestion.id}
                    className="p-4 rounded-lg border bg-card space-y-3"
                  >
                    {/* Scratched wrestler */}
                    <div className="flex items-center gap-2">
                      <UserX className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-muted-foreground">Scratched:</span>
                      <Badge
                        style={{
                          backgroundColor: suggestion.scratched_wrestler?.team_color || 'hsl(var(--muted))',
                          color: getContrastColor(suggestion.scratched_wrestler?.team_color),
                        }}
                      >
                        {suggestion.scratched_wrestler?.team_abbreviation}
                      </Badge>
                      <span className="font-medium">
                        {suggestion.scratched_wrestler?.first_name} {suggestion.scratched_wrestler?.last_name}
                      </span>
                    </div>

                    {/* Remaining wrestler */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground ml-6">Needs opponent:</span>
                      <Badge
                        style={{
                          backgroundColor: suggestion.remaining_wrestler?.team_color || 'hsl(var(--muted))',
                          color: getContrastColor(suggestion.remaining_wrestler?.team_color),
                        }}
                      >
                        {suggestion.remaining_wrestler?.team_abbreviation}
                      </Badge>
                      <span className="font-medium">
                        {suggestion.remaining_wrestler?.first_name} {suggestion.remaining_wrestler?.last_name}
                      </span>
                      {suggestion.remaining_wrestler && (
                        <span className="text-xs text-muted-foreground">
                          ({suggestion.remaining_wrestler.weight}lbs, age {getAge(suggestion.remaining_wrestler.date_of_birth)})
                        </span>
                      )}
                    </div>

                    {/* Suggested opponent */}
                    {suggestion.suggested_opponent && (
                      <div className="flex items-center gap-2 pl-6">
                        <ArrowRight className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-muted-foreground">Suggested:</span>
                        <Badge
                          style={{
                            backgroundColor: suggestion.suggested_opponent?.team_color || 'hsl(var(--muted))',
                            color: getContrastColor(suggestion.suggested_opponent?.team_color),
                          }}
                        >
                          {suggestion.suggested_opponent?.team_abbreviation}
                        </Badge>
                        <span className="font-medium">
                          {suggestion.suggested_opponent?.first_name} {suggestion.suggested_opponent?.last_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({suggestion.suggested_opponent?.weight}lbs, {suggestion.suggested_opponent?.match_count} matches)
                        </span>
                      </div>
                    )}

                    {/* Meta info */}
                    <div className="text-xs text-muted-foreground pl-6">
                      Requested by {suggestion.suggested_by_name} · {format(parseISO(suggestion.created_at), 'MMM d, h:mm a')}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(suggestion)}
                        disabled={processing === suggestion.id || !suggestion.suggested_opponent_id}
                        className="gap-1.5"
                      >
                        {processing === suggestion.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(suggestion)}
                        disabled={processing === suggestion.id}
                        className="gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        Remove Match
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectingOpponent(suggestion.id)}
                        disabled={processing === suggestion.id}
                        className="gap-1.5"
                      >
                        <Search className="w-4 h-4" />
                        Find Different
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
