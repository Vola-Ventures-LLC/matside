import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, UserCheck, AlertTriangle, ArrowRight, Trash2, RefreshCw } from 'lucide-react';
import { differenceInYears, parseISO } from 'date-fns';

interface Wrestler {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  weight: number;
  experience: number;
  skill: number;
  team_id: string;
  team_abbreviation: string;
  team_color: string | null;
  attendance_status: string;
  match_count: number;
}

interface Match {
  id: string;
  wrestler_a_id: string;
  wrestler_b_id: string;
  wrestler_a: Wrestler | null;
  wrestler_b: Wrestler | null;
  mat_number: number | null;
  match_order: number | null;
  status: string;
  scratched_wrestler_id?: string | null;
}

interface ParticipatingTeam {
  team_id: string;
  team_name: string;
  abbreviation: string;
  primary_color: string | null;
}

type EditMode = 'scratch' | 'change';

interface EditMatchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: Match | null;
  selectedWrestlerId: string | null;
  allWrestlers: Wrestler[];
  allMatches: Match[];
  teams: ParticipatingTeam[];
  meetId: string;
  pairingStatus: 'draft' | 'planned' | 'published';
  userId: string | null;
  hostTeamId: string;
  onSuccess: () => void;
  mode: EditMode;
}

export function EditMatchSheet({
  open,
  onOpenChange,
  match,
  selectedWrestlerId,
  allWrestlers,
  allMatches,
  teams,
  meetId,
  pairingStatus,
  userId,
  hostTeamId,
  onSuccess,
  mode,
}: EditMatchSheetProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState<string>('same');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const selectedWrestler = useMemo(() => {
    if (!match || !selectedWrestlerId) return null;
    return match.wrestler_a_id === selectedWrestlerId ? match.wrestler_a : match.wrestler_b;
  }, [match, selectedWrestlerId]);

  const opponent = useMemo(() => {
    if (!match || !selectedWrestlerId) return null;
    return match.wrestler_a_id === selectedWrestlerId ? match.wrestler_b : match.wrestler_a;
  }, [match, selectedWrestlerId]);

  const getAge = (dob: string) => differenceInYears(new Date(), parseISO(dob));

  // Calculate compatibility score between two wrestlers
  const getCompatibilityScore = (replacement: Wrestler, opp: Wrestler) => {
    const weightDiff = Math.abs(replacement.weight - opp.weight);
    const ageDiff = Math.abs(getAge(replacement.date_of_birth) - getAge(opp.date_of_birth));
    const expDiff = Math.abs(replacement.experience - opp.experience);
    const skillDiff = Math.abs(replacement.skill - opp.skill);
    
    // Lower score is better
    return weightDiff * 2 + ageDiff * 3 + expDiff * 5 + skillDiff * 5;
  };

  // In scratch mode: replace the selected wrestler (from their team)
  // In edit mode: replace the opponent (find new opponent for selected wrestler)
  const wrestlerBeingReplaced = mode === 'scratch' ? selectedWrestler : opponent;
  const wrestlerStaying = mode === 'scratch' ? opponent : selectedWrestler;

  // Find replacement candidates
  const replacementCandidates = useMemo(() => {
    if (!wrestlerBeingReplaced || !wrestlerStaying || !match) return [];

    let eligibleWrestlers = allWrestlers.filter(w => 
      w.id !== selectedWrestler?.id &&
      w.id !== opponent?.id &&
      ['attending', 'arriving_late', 'leaving_early'].includes(w.attendance_status)
    );

    // Apply team filter - default to the team of the wrestler being replaced
    if (teamFilter === 'same') {
      eligibleWrestlers = eligibleWrestlers.filter(w => w.team_id === wrestlerBeingReplaced.team_id);
    } else if (teamFilter !== 'all') {
      eligibleWrestlers = eligibleWrestlers.filter(w => w.team_id === teamFilter);
    }

    // For scratch mode, only allow same team as the scratched wrestler
    if (mode === 'scratch') {
      eligibleWrestlers = eligibleWrestlers.filter(w => w.team_id === wrestlerBeingReplaced.team_id);
    }

    // Filter out wrestlers already matched against the wrestler who is staying
    eligibleWrestlers = eligibleWrestlers.filter(w => {
      const alreadyMatchedAgainstStaying = allMatches.some(m => 
        m.id !== match.id && (
          (m.wrestler_a_id === w.id && m.wrestler_b_id === wrestlerStaying.id) ||
          (m.wrestler_b_id === w.id && m.wrestler_a_id === wrestlerStaying.id)
        )
      );
      return !alreadyMatchedAgainstStaying;
    });

    // Score and sort by compatibility with the wrestler who is staying
    const scored = eligibleWrestlers.map(w => ({
      wrestler: w,
      score: getCompatibilityScore(w, wrestlerStaying),
    }));

    scored.sort((a, b) => a.score - b.score);

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return scored.filter(s => 
        s.wrestler.first_name.toLowerCase().includes(term) ||
        s.wrestler.last_name.toLowerCase().includes(term)
      );
    }

    return scored;
  }, [wrestlerBeingReplaced, wrestlerStaying, match, allWrestlers, allMatches, searchTerm, teamFilter, mode, selectedWrestler, opponent]);

  const handleSelectReplacement = async (replacementId: string) => {
    if (!match || !selectedWrestlerId || !opponent) return;
    setSaving(true);

    try {
      let updateData: Record<string, unknown>;
      
      if (mode === 'scratch') {
        // Scratch mode: replace the selected wrestler's position
        updateData = match.wrestler_a_id === selectedWrestlerId 
          ? { wrestler_a_id: replacementId }
          : { wrestler_b_id: replacementId };
        updateData.scratched_wrestler_id = selectedWrestlerId;
      } else {
        // Edit mode: replace the opponent's position
        updateData = match.wrestler_a_id === opponent.id 
          ? { wrestler_a_id: replacementId }
          : { wrestler_b_id: replacementId };
      }

      const { error } = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', match.id);

      if (error) throw error;

      // Log to audit trail if meet is planned or published
      if ((pairingStatus === 'planned' || pairingStatus === 'published') && userId) {
        const replacement = allWrestlers.find(w => w.id === replacementId);
        const oldWrestler = wrestlerBeingReplaced;
        await supabase.from('pairing_audit').insert({
          meet_id: meetId,
          team_id: hostTeamId,
          wrestler_id: replacementId,
          match_id: match.id,
          changed_by: userId,
          action: mode === 'scratch' ? 'wrestler_replaced' : 'opponent_changed',
          old_value: { 
            wrestler: oldWrestler ? `${oldWrestler.first_name} ${oldWrestler.last_name}` : 'Unknown'
          },
          new_value: { 
            wrestler: replacement ? `${replacement.first_name} ${replacement.last_name}` : 'Unknown'
          },
          description: mode === 'scratch' 
            ? `Replaced ${oldWrestler?.first_name} ${oldWrestler?.last_name} with ${replacement?.first_name} ${replacement?.last_name}`
            : `Changed opponent from ${oldWrestler?.first_name} ${oldWrestler?.last_name} to ${replacement?.first_name} ${replacement?.last_name}`,
        });
      }

      toast({
        title: mode === 'scratch' ? 'Replacement confirmed' : 'Opponent changed',
        description: mode === 'scratch' 
          ? 'The scratched wrestler has been replaced.'
          : 'The matchup has been updated with a new opponent.',
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMatch = async (renumber: boolean) => {
    if (!match) return;
    setDeleting(true);
    setShowDeleteDialog(false);

    try {
      const deletedMatchOrder = match.match_order;
      const deletedMatNumber = match.mat_number;

      // Log to audit trail BEFORE deleting if meet is planned or published
      if ((pairingStatus === 'planned' || pairingStatus === 'published') && userId) {
        await supabase.from('pairing_audit').insert({
          meet_id: meetId,
          team_id: hostTeamId,
          wrestler_id: selectedWrestler?.id || null,
          match_id: null, // Match will be deleted so we don't reference it
          changed_by: userId,
          action: 'match_removed',
          old_value: { 
            wrestler_a: selectedWrestler ? `${selectedWrestler.first_name} ${selectedWrestler.last_name}` : 'Unknown',
            wrestler_b: opponent ? `${opponent.first_name} ${opponent.last_name}` : 'Unknown',
            mat_number: deletedMatNumber,
            match_order: deletedMatchOrder
          },
          new_value: null,
          description: `Removed match #${deletedMatchOrder}: ${selectedWrestler?.first_name} ${selectedWrestler?.last_name} vs ${opponent?.first_name} ${opponent?.last_name} from Mat ${deletedMatNumber}`,
        });
      }

      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', match.id);

      if (error) throw error;

      // Renumber subsequent matches on the same mat if requested
      if (renumber && deletedMatchOrder && deletedMatNumber) {
        const subsequentMatches = allMatches
          .filter(m => 
            m.id !== match.id && 
            m.mat_number === deletedMatNumber && 
            m.match_order && 
            m.match_order > deletedMatchOrder
          )
          .sort((a, b) => (a.match_order || 0) - (b.match_order || 0));

        for (const m of subsequentMatches) {
          await supabase
            .from('matches')
            .update({ match_order: (m.match_order || 0) - 1 })
            .eq('id', m.id);
        }
      }

      toast({
        title: 'Match deleted',
        description: renumber 
          ? 'The match has been removed and subsequent matches renumbered.'
          : 'The match has been removed from the pairings.',
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setDeleting(false);
    }
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

  const getScoreBadge = (score: number) => {
    if (score < 15) return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Great Match</Badge>;
    if (score < 30) return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Good Match</Badge>;
    return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Fair Match</Badge>;
  };

  if (!match || !selectedWrestler || !opponent) return null;

  const isScratchMode = mode === 'scratch';
  const title = isScratchMode ? 'Replace Scratched Wrestler' : 'Edit Match';
  const description = isScratchMode 
    ? `Select a replacement for the scratched wrestler in match #${match.match_order}`
    : `Change wrestler or remove match #${match.match_order}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full overflow-hidden">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            {isScratchMode ? (
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            ) : (
              <RefreshCw className="w-5 h-5 text-primary" />
            )}
            {title}
          </SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="mt-6 space-y-6 pb-6">
            {/* Current Match Info */}
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="text-sm text-muted-foreground mb-2">Current Match</div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      style={{
                        backgroundColor: selectedWrestler.team_color || 'hsl(var(--muted))',
                        color: getContrastColor(selectedWrestler.team_color),
                      }}
                    >
                      {selectedWrestler.team_abbreviation}
                    </Badge>
                    <span className={isScratchMode ? 'line-through text-muted-foreground' : ''}>
                      {selectedWrestler.first_name} {selectedWrestler.last_name}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {selectedWrestler.weight}lbs • Age {getAge(selectedWrestler.date_of_birth)} • Exp {selectedWrestler.experience} • Skill {selectedWrestler.skill}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      style={{
                        backgroundColor: opponent.team_color || 'hsl(var(--muted))',
                        color: getContrastColor(opponent.team_color),
                      }}
                    >
                      {opponent.team_abbreviation}
                    </Badge>
                    <span>{opponent.first_name} {opponent.last_name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {opponent.weight}lbs • Age {getAge(opponent.date_of_birth)} • Exp {opponent.experience} • Skill {opponent.skill}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

          {/* Delete Match Option */}
          <Button 
            variant="destructive" 
            className="w-full" 
            disabled={deleting}
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? 'Deleting...' : 'Delete This Match'}
          </Button>
          
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Match #{match.match_order}?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    This will permanently remove the match between {selectedWrestler.first_name} {selectedWrestler.last_name} and {opponent.first_name} {opponent.last_name}.
                  </p>
                  <p className="font-medium">
                    Should subsequent matches on Mat {match.mat_number} be renumbered?
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button 
                  variant="outline" 
                  onClick={() => handleDeleteMatch(false)}
                  disabled={deleting}
                >
                  Delete Only (No Renumber)
                </Button>
                <AlertDialogAction 
                  onClick={() => handleDeleteMatch(true)} 
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleting}
                >
                  Delete & Renumber
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

            <Separator />

            {/* Search & Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>
                  {isScratchMode 
                    ? `Find Replacement for ${selectedWrestler.first_name} ${selectedWrestler.last_name}`
                    : `Find New Opponent for ${selectedWrestler.first_name} ${selectedWrestler.last_name}`
                  }
                </Label>
                {!isScratchMode && (
                  <Select value={teamFilter} onValueChange={setTeamFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filter by team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="same">Same Team</SelectItem>
                      <SelectItem value="all">All Teams</SelectItem>
                      {teams.map(t => (
                        <SelectItem key={t.team_id} value={t.team_id}>{t.abbreviation}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search wrestlers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-2">
              <Label>
                {isScratchMode 
                  ? `Recommended Replacements from ${selectedWrestler.team_abbreviation}` 
                  : 'Recommended Wrestlers'
                } ({replacementCandidates.length})
              </Label>
              <div className="rounded-md border">
                {replacementCandidates.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No eligible wrestlers found
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {replacementCandidates.map(({ wrestler, score }) => (
                      <div
                        key={wrestler.id}
                        className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                style={{
                                  backgroundColor: wrestler.team_color || 'hsl(var(--muted))',
                                  color: getContrastColor(wrestler.team_color),
                                }}
                              >
                                {wrestler.team_abbreviation}
                              </Badge>
                              <span className="font-medium">
                                {wrestler.first_name} {wrestler.last_name}
                              </span>
                              {getScoreBadge(score)}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {wrestler.weight}lbs • Age {getAge(wrestler.date_of_birth)} • Exp {wrestler.experience} • Skill {wrestler.skill}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Currently has {wrestler.match_count} match{wrestler.match_count !== 1 ? 'es' : ''}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleSelectReplacement(wrestler.id)}
                            disabled={saving}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Select
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
