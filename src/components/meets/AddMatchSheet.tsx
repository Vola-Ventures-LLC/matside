import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Sparkles, Target } from 'lucide-react';
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
}

interface ParticipatingTeam {
  team_id: string;
  team_name: string;
  abbreviation: string;
  primary_color: string | null;
}

interface MatRule {
  mat_number: number;
  min_age: number;
  max_age: number;
  min_experience: number;
  max_experience: number;
  min_skill: number;
  max_skill: number;
  max_matches: number;
}

interface AddMatchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wrestler: Wrestler | null;
  allWrestlers: Wrestler[];
  allMatches: Match[];
  teams: ParticipatingTeam[];
  meetId: string;
  matRules: MatRule[];
  pairingStatus: 'draft' | 'planned' | 'published';
  userId: string | null;
  hostTeamId: string;
  onSuccess: () => void;
}

export function AddMatchSheet({
  open,
  onOpenChange,
  wrestler,
  allWrestlers,
  allMatches,
  teams,
  meetId,
  matRules,
  pairingStatus,
  userId,
  hostTeamId,
  onSuccess,
}: AddMatchSheetProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [selectedOpponentId, setSelectedOpponentId] = useState<string | null>(null);
  const [selectedMat, setSelectedMat] = useState<string>('suggested');
  const [saving, setSaving] = useState(false);

  const getAge = (dob: string) => differenceInYears(new Date(), parseISO(dob));

  // Calculate compatibility score between two wrestlers
  const getCompatibilityScore = (w1: Wrestler, w2: Wrestler) => {
    const weightDiff = Math.abs(w1.weight - w2.weight);
    const ageDiff = Math.abs(getAge(w1.date_of_birth) - getAge(w2.date_of_birth));
    const expDiff = Math.abs(w1.experience - w2.experience);
    const skillDiff = Math.abs(w1.skill - w2.skill);
    
    // Lower score is better
    return weightDiff * 2 + ageDiff * 3 + expDiff * 5 + skillDiff * 5;
  };

  // Find potential opponents
  const potentialOpponents = useMemo(() => {
    if (!wrestler) return [];

    let eligibleWrestlers = allWrestlers.filter(w => 
      w.id !== wrestler.id &&
      ['attending', 'arriving_late', 'leaving_early'].includes(w.attendance_status)
    );

    // Apply team filter
    if (teamFilter !== 'all') {
      eligibleWrestlers = eligibleWrestlers.filter(w => w.team_id === teamFilter);
    }

    // Filter out wrestlers already matched against this wrestler
    eligibleWrestlers = eligibleWrestlers.filter(w => {
      const alreadyMatched = allMatches.some(m => 
        (m.wrestler_a_id === w.id && m.wrestler_b_id === wrestler.id) ||
        (m.wrestler_b_id === w.id && m.wrestler_a_id === wrestler.id)
      );
      return !alreadyMatched;
    });

    // Score and sort by compatibility
    const scored = eligibleWrestlers.map(w => ({
      wrestler: w,
      score: getCompatibilityScore(wrestler, w),
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
  }, [wrestler, allWrestlers, allMatches, searchTerm, teamFilter]);

  // Calculate suggested mat based on wrestler attributes and mat rules
  // Derive active mat count from mat rules (highest mat_number), fallback to 2
  const activeMatCount = useMemo(() => {
    if (matRules.length === 0) return 2;
    return Math.max(...matRules.map(r => r.mat_number));
  }, [matRules]);

  const suggestedMat = useMemo(() => {
    if (!wrestler) return 1;
    
    const selectedOpponent = selectedOpponentId 
      ? allWrestlers.find(w => w.id === selectedOpponentId) 
      : potentialOpponents[0]?.wrestler;
    
    if (!selectedOpponent) return 1;

    const avgAge = (getAge(wrestler.date_of_birth) + getAge(selectedOpponent.date_of_birth)) / 2;
    const avgExp = (wrestler.experience + selectedOpponent.experience) / 2;
    const avgSkill = (wrestler.skill + selectedOpponent.skill) / 2;

    // Filter rules to only include mats within the active mat count
    const validMatRules = matRules.filter(r => r.mat_number <= activeMatCount);

    // Check each mat rule to find the best fit
    for (const rule of validMatRules) {
      if (avgAge >= rule.min_age && avgAge <= rule.max_age &&
          avgExp >= rule.min_experience && avgExp <= rule.max_experience &&
          avgSkill >= rule.min_skill && avgSkill <= rule.max_skill) {
        
        // Check if mat has reached max matches
        const matMatchCount = allMatches.filter(m => m.mat_number === rule.mat_number).length;
        if (matMatchCount < rule.max_matches) {
          return rule.mat_number;
        }
      }
    }

    // If no mat rule fits, find the mat with fewest matches
    const matMatchCounts: Record<number, number> = {};
    for (let i = 1; i <= activeMatCount; i++) {
      matMatchCounts[i] = allMatches.filter(m => m.mat_number === i).length;
    }
    
    let minMat = 1;
    let minCount = matMatchCounts[1] || 0;
    for (let i = 2; i <= activeMatCount; i++) {
      const count = matMatchCounts[i] || 0;
      if (count < minCount) {
        minCount = count;
        minMat = i;
      }
    }
    
    return minMat;
  }, [wrestler, selectedOpponentId, allWrestlers, potentialOpponents, matRules, allMatches, activeMatCount]);

  // Get next match order for a given mat
  const getNextMatchOrder = (matNumber: number) => {
    const matMatches = allMatches.filter(m => m.mat_number === matNumber);
    const maxOrder = matMatches.reduce((max, m) => {
      const order = m.match_order || 0;
      return order > max ? order : max;
    }, matNumber * 100 - 1);
    return maxOrder + 1;
  };

  const handleAddMatch = async () => {
    if (!wrestler || !selectedOpponentId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select an opponent.',
      });
      return;
    }

    setSaving(true);

    try {
      const matNumber = selectedMat === 'suggested' ? suggestedMat : parseInt(selectedMat);
      const matchOrder = getNextMatchOrder(matNumber);

      const { data: insertedMatch, error } = await supabase
        .from('matches')
        .insert({
          meet_id: meetId,
          wrestler_a_id: wrestler.id,
          wrestler_b_id: selectedOpponentId,
          mat_number: matNumber,
          match_order: matchOrder,
          status: 'pending',
        })
        .select('id')
        .single();

      if (error) throw error;

      // Log to audit trail if meet is planned or published
      if ((pairingStatus === 'planned' || pairingStatus === 'published') && userId && insertedMatch) {
        const selectedOpponent = allWrestlers.find(w => w.id === selectedOpponentId);
        await supabase.from('pairing_audit').insert({
          meet_id: meetId,
          team_id: hostTeamId,
          wrestler_id: wrestler.id,
          match_id: insertedMatch.id,
          changed_by: userId,
          action: 'match_added',
          old_value: null,
          new_value: { 
            wrestler_a: `${wrestler.first_name} ${wrestler.last_name}`,
            wrestler_b: selectedOpponent ? `${selectedOpponent.first_name} ${selectedOpponent.last_name}` : 'Unknown',
            mat_number: matNumber,
            match_order: matchOrder
          },
          description: `Added match: ${wrestler.first_name} ${wrestler.last_name} vs ${selectedOpponent?.first_name || ''} ${selectedOpponent?.last_name || ''} on Mat ${matNumber}`,
        });
      }

      toast({
        title: 'Match added',
        description: `Match added to Mat ${matNumber}.`,
      });
      
      // Reset state
      setSelectedOpponentId(null);
      setSelectedMat('suggested');
      setSearchTerm('');
      
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
    if (score < 15) return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Great</Badge>;
    if (score < 30) return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Good</Badge>;
    return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Fair</Badge>;
  };

  // Get match count per mat for display
  const matMatchCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (let i = 1; i <= activeMatCount; i++) {
      counts[i] = allMatches.filter(m => m.mat_number === i).length;
    }
    return counts;
  }, [allMatches, activeMatCount]);

  if (!wrestler) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full overflow-hidden">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Add Match
          </SheetTitle>
          <SheetDescription>
            Create a new match for {wrestler.first_name} {wrestler.last_name}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="mt-6 space-y-6 pb-6">
            {/* Selected Wrestler Info */}
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="text-sm text-muted-foreground mb-2">Adding match for</div>
              <div className="flex items-center gap-2">
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
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {wrestler.weight}lbs • Age {getAge(wrestler.date_of_birth)} • Exp {wrestler.experience} • Skill {wrestler.skill}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Currently has {wrestler.match_count} match{wrestler.match_count !== 1 ? 'es' : ''}
              </div>
            </div>

            <Separator />

            {/* Mat Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Mat Assignment
              </Label>
              <Select value={selectedMat} onValueChange={setSelectedMat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suggested">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span>Suggested: Mat {suggestedMat}</span>
                      <span className="text-muted-foreground">
                        ({matMatchCounts[suggestedMat] || 0} matches)
                      </span>
                    </div>
                  </SelectItem>
                  {Array.from({ length: activeMatCount }, (_, i) => i + 1).map(mat => (
                    <SelectItem key={mat} value={mat.toString()}>
                      Mat {mat} ({matMatchCounts[mat] || 0} matches)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {matRules.find(r => r.mat_number === suggestedMat) && (
                <p className="text-xs text-muted-foreground">
                  Mat {suggestedMat} is suggested based on age, experience, and skill preferences.
                </p>
              )}
            </div>

            <Separator />

            {/* Search & Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Select Opponent</Label>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter by team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams.map(t => (
                      <SelectItem key={t.team_id} value={t.team_id}>{t.abbreviation}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            {/* Opponent List */}
            <div className="space-y-2">
              <Label>
                Suggested Opponents ({potentialOpponents.length})
              </Label>
              <div className="rounded-md border">
                {potentialOpponents.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No eligible opponents found
                  </div>
                ) : (
                  <div className="p-2 space-y-2 max-h-[300px] overflow-y-auto">
                    {potentialOpponents.map(({ wrestler: opp, score }) => (
                      <div
                        key={opp.id}
                        onClick={() => setSelectedOpponentId(opp.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedOpponentId === opp.id 
                            ? 'border-primary bg-primary/10' 
                            : 'bg-card hover:bg-accent/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                style={{
                                  backgroundColor: opp.team_color || 'hsl(var(--muted))',
                                  color: getContrastColor(opp.team_color),
                                }}
                              >
                                {opp.team_abbreviation}
                              </Badge>
                              <span className="font-medium">
                                {opp.first_name} {opp.last_name}
                              </span>
                              {getScoreBadge(score)}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {opp.weight}lbs • Age {getAge(opp.date_of_birth)} • Exp {opp.experience} • Skill {opp.skill}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {opp.match_count} match{opp.match_count !== 1 ? 'es' : ''} assigned
                            </div>
                          </div>
                          {selectedOpponentId === opp.id && (
                            <Badge className="bg-primary text-primary-foreground">Selected</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex-shrink-0 pt-4 border-t">
          <Button 
            onClick={handleAddMatch} 
            disabled={saving || !selectedOpponentId}
            className="w-full"
          >
            {saving ? 'Adding...' : 'Add Match'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
