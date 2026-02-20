import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, UserX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInYears, parseISO } from 'date-fns';

interface Wrestler {
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
}

interface Match {
  id: string;
  wrestler_a_id: string;
  wrestler_b_id: string;
  wrestler_a: Wrestler | null;
  wrestler_b: Wrestler | null;
  mat_number: number | null;
  match_order: number | null;
}

interface ScratchWrestlerDialogProps {
  meetId: string;
  wrestler: Wrestler;
  matches: Match[];
  allWrestlers: Wrestler[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function ScratchWrestlerDialog({
  meetId,
  wrestler,
  matches,
  allWrestlers,
  open,
  onOpenChange,
  onComplete,
}: ScratchWrestlerDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);

  // Find all matches involving this wrestler
  const wrestlerMatches = matches.filter(
    m => m.wrestler_a_id === wrestler.id || m.wrestler_b_id === wrestler.id
  );

  const getAge = (dob: string) => differenceInYears(new Date(), parseISO(dob));

  // Find best replacement for a given opponent
  const findBestReplacement = (opponent: Wrestler | null, excludeIds: string[]): Wrestler | null => {
    if (!opponent) return null;

    const opponentAge = getAge(opponent.date_of_birth);

    // Get wrestlers from the same team as the scratched wrestler
    // who are not already in a match with this opponent
    const candidates = allWrestlers.filter(w => {
      if (w.id === wrestler.id) return false;
      if (w.team_id !== wrestler.team_id) return false;
      if (excludeIds.includes(w.id)) return false;
      
      // Check if already matched with this opponent
      const alreadyMatched = matches.some(
        m => 
          (m.wrestler_a_id === w.id && m.wrestler_b_id === opponent.id) ||
          (m.wrestler_b_id === w.id && m.wrestler_a_id === opponent.id)
      );
      if (alreadyMatched) return false;

      return true;
    });

    if (candidates.length === 0) return null;

    // Score candidates - prefer those with fewer matches and similar attributes
    const scored = candidates.map(c => {
      const matchCount = matches.filter(
        m => m.wrestler_a_id === c.id || m.wrestler_b_id === c.id
      ).length;
      
      const ageDiff = Math.abs(getAge(c.date_of_birth) - opponentAge);
      const weightDiff = Math.abs(c.weight - opponent.weight);
      const expDiff = Math.abs(c.experience - opponent.experience);
      const skillDiff = Math.abs(c.skill - opponent.skill);

      // Lower score is better
      // Heavy weight on match count to prefer kids with fewer matches
      const score = matchCount * 100 + weightDiff * 2 + ageDiff * 3 + expDiff * 5 + skillDiff * 5;

      return { wrestler: c, score };
    });

    // Sort by score (lower is better)
    scored.sort((a, b) => a.score - b.score);

    return scored[0]?.wrestler || null;
  };

  const handleScratch = async () => {
    if (!user) return;
    setProcessing(true);

    try {
      const excludeIds: string[] = [wrestler.id];

      for (const match of wrestlerMatches) {
        const isWrestlerA = match.wrestler_a_id === wrestler.id;
        const opponent = isWrestlerA ? match.wrestler_b : match.wrestler_a;
        const remainingWrestlerId = isWrestlerA ? match.wrestler_b_id : match.wrestler_a_id;

        // Find best replacement
        const replacement = findBestReplacement(opponent, excludeIds);
        if (replacement) {
          excludeIds.push(replacement.id);
        }

        // Create scratch suggestion
        const { error: suggestionError } = await supabase
          .from('scratch_suggestions')
          .insert({
            meet_id: meetId,
            original_match_id: match.id,
            scratched_wrestler_id: wrestler.id,
            remaining_wrestler_id: remainingWrestlerId,
            suggested_opponent_id: replacement?.id || null,
            suggested_by: user.id,
          });

        if (suggestionError) throw suggestionError;

        // Add audit entry
        const { error: auditError } = await supabase
          .from('pairing_audit')
          .insert({
            meet_id: meetId,
            team_id: wrestler.team_id,
            wrestler_id: wrestler.id,
            match_id: match.id,
            changed_by: user.id,
            action: 'scratch',
            old_value: { match_id: match.id },
            new_value: { suggested_replacement_id: replacement?.id },
            description: `${wrestler.first_name} ${wrestler.last_name} scratched from match vs ${opponent?.first_name} ${opponent?.last_name}`,
          });

        if (auditError) throw auditError;
      }

      toast({
        title: 'Wrestler scratched',
        description: `${wrestlerMatches.length} match${wrestlerMatches.length !== 1 ? 'es' : ''} sent for host approval.`,
      });

      onComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error scratching wrestler:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to scratch wrestler.',
      });
    } finally {
      setProcessing(false);
    }
  };

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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-red-400" />
            Scratch Wrestler
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Remove{' '}
                <span className="font-medium text-foreground">
                  {wrestler.first_name} {wrestler.last_name}
                </span>{' '}
                from all {wrestlerMatches.length} scheduled match{wrestlerMatches.length !== 1 ? 'es' : ''}?
              </p>

              {wrestlerMatches.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Affected matches:</p>
                  <div className="space-y-1.5">
                    {wrestlerMatches.map(match => {
                      const opponent = match.wrestler_a_id === wrestler.id ? match.wrestler_b : match.wrestler_a;
                      return (
                        <div key={match.id} className="flex items-center gap-2 text-sm">
                          <span>vs</span>
                          {opponent && (
                            <>
                              <Badge
                                className="text-xs"
                                style={{
                                  backgroundColor: opponent.team_color || 'hsl(var(--muted))',
                                  color: getContrastColor(opponent.team_color),
                                }}
                              >
                                {opponent.team_abbreviation}
                              </Badge>
                              <span>
                                {opponent.first_name} {opponent.last_name}
                              </span>
                            </>
                          )}
                          {match.mat_number && (
                            <span className="text-muted-foreground">(Mat {match.mat_number})</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                The system will suggest replacement opponents (preferring wrestlers with fewer matches). 
                The host must approve each replacement before it takes effect.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleScratch}
            disabled={processing}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Scratch Wrestler'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
