import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MeetRulesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetId: string;
  hostTeamId: string;
  onSuccess?: () => void;
}

interface MeetRules {
  id?: string;
  match_priority_age: number;
  match_priority_weight: number;
  match_priority_experience: number;
  match_priority_skill: number;
  max_age_diff: number;
  max_matches_per_wrestler: number;
  teammates_can_wrestle: boolean;
  conflict_min_gap: number;
}

interface MatRule {
  id?: string;
  mat_number: number;
  min_experience: number;
  max_experience: number;
  min_age: number;
  max_age: number;
  min_skill: number;
  max_skill: number;
  max_matches: number;
}

const priorityOptions = [
  { value: '1', label: '1 (Highest)' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4 (Lowest)' },
];

export function MeetRulesSheet({
  open,
  onOpenChange,
  meetId,
  hostTeamId,
  onSuccess,
}: MeetRulesSheetProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingToDefaults, setResettingToDefaults] = useState(false);
  
  const [rules, setRules] = useState<MeetRules>({
    match_priority_age: 1,
    match_priority_weight: 2,
    match_priority_experience: 3,
    match_priority_skill: 4,
    max_age_diff: 1,
    max_matches_per_wrestler: 4,
    teammates_can_wrestle: false,
    conflict_min_gap: 7,
  });

  const [matRules, setMatRules] = useState<MatRule[]>([]);
  const [teamDefaults, setTeamDefaults] = useState<MeetRules | null>(null);
  const [teamMatDefaults, setTeamMatDefaults] = useState<MatRule[]>([]);
  const [hasCustomRules, setHasCustomRules] = useState(false);
  const [hasCustomMatRules, setHasCustomMatRules] = useState(false);

  useEffect(() => {
    if (open) {
      fetchRules();
    }
  }, [open, meetId, hostTeamId]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      // Fetch team defaults for general rules
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('match_priority_age, match_priority_weight, match_priority_experience, match_priority_skill, max_age_diff, max_matches_per_wrestler, teammates_can_wrestle, conflict_min_gap')
        .eq('id', hostTeamId)
        .single();

      if (teamError) throw teamError;
      
      const defaults: MeetRules = {
        match_priority_age: teamData.match_priority_age,
        match_priority_weight: teamData.match_priority_weight,
        match_priority_experience: teamData.match_priority_experience,
        match_priority_skill: teamData.match_priority_skill,
        max_age_diff: teamData.max_age_diff,
        max_matches_per_wrestler: teamData.max_matches_per_wrestler,
        teammates_can_wrestle: teamData.teammates_can_wrestle,
        conflict_min_gap: teamData.conflict_min_gap,
      };
      setTeamDefaults(defaults);

      // Fetch team mat rules defaults
      const { data: teamMatRulesData } = await supabase
        .from('mat_rules')
        .select('id, mat_number, min_experience, max_experience, min_age, max_age, min_skill, max_skill, max_matches')
        .eq('team_id', hostTeamId)
        .order('mat_number', { ascending: true });

      const teamMatRulesDefaults = (teamMatRulesData || []).map(r => ({
        mat_number: r.mat_number,
        min_experience: r.min_experience,
        max_experience: r.max_experience,
        min_age: r.min_age,
        max_age: r.max_age,
        min_skill: r.min_skill,
        max_skill: r.max_skill,
        max_matches: r.max_matches,
      }));
      setTeamMatDefaults(teamMatRulesDefaults);

      // Fetch meet-specific general rules
      const { data: meetRulesData, error: meetRulesError } = await supabase
        .from('meet_rules')
        .select('*')
        .eq('meet_id', meetId)
        .maybeSingle();

      if (meetRulesError) throw meetRulesError;

      if (meetRulesData) {
        setRules({
          id: meetRulesData.id,
          match_priority_age: meetRulesData.match_priority_age,
          match_priority_weight: meetRulesData.match_priority_weight,
          match_priority_experience: meetRulesData.match_priority_experience,
          match_priority_skill: meetRulesData.match_priority_skill,
          max_age_diff: meetRulesData.max_age_diff,
          max_matches_per_wrestler: meetRulesData.max_matches_per_wrestler,
          teammates_can_wrestle: meetRulesData.teammates_can_wrestle,
          conflict_min_gap: meetRulesData.conflict_min_gap,
        });
        setHasCustomRules(true);
      } else {
        setRules(defaults);
        setHasCustomRules(false);
      }

      // Fetch meet-specific mat rules
      const { data: meetMatRulesData, error: meetMatRulesError } = await supabase
        .from('meet_mat_rules')
        .select('id, mat_number, min_experience, max_experience, min_age, max_age, min_skill, max_skill, max_matches')
        .eq('meet_id', meetId)
        .order('mat_number', { ascending: true });

      if (meetMatRulesError) throw meetMatRulesError;

      if (meetMatRulesData && meetMatRulesData.length > 0) {
        setMatRules(meetMatRulesData);
        setHasCustomMatRules(true);
      } else {
        setMatRules(teamMatRulesDefaults);
        setHasCustomMatRules(false);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load rules',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save general rules
      const rulesData = {
        meet_id: meetId,
        match_priority_age: rules.match_priority_age,
        match_priority_weight: rules.match_priority_weight,
        match_priority_experience: rules.match_priority_experience,
        match_priority_skill: rules.match_priority_skill,
        max_age_diff: rules.max_age_diff,
        max_matches_per_wrestler: rules.max_matches_per_wrestler,
        teammates_can_wrestle: rules.teammates_can_wrestle,
        conflict_min_gap: rules.conflict_min_gap,
      };

      if (rules.id) {
        const { error } = await supabase
          .from('meet_rules')
          .update(rulesData)
          .eq('id', rules.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('meet_rules')
          .insert(rulesData);
        if (error) throw error;
      }

      // Save mat rules - delete existing first
      const { error: deleteError } = await supabase
        .from('meet_mat_rules')
        .delete()
        .eq('meet_id', meetId);
      
      if (deleteError) throw deleteError;

      // Insert new mat rules
      if (matRules.length > 0) {
        const matRulesData = matRules.map(r => ({
          meet_id: meetId,
          mat_number: r.mat_number,
          min_experience: r.min_experience,
          max_experience: r.max_experience,
          min_age: r.min_age,
          max_age: r.max_age,
          min_skill: r.min_skill,
          max_skill: r.max_skill,
          max_matches: r.max_matches,
        }));

        const { error: insertError } = await supabase
          .from('meet_mat_rules')
          .insert(matRulesData);
        
        if (insertError) throw insertError;
      }

      toast({
        title: 'Rules saved',
        description: 'Meet pairing rules have been updated',
      });
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to save rules',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (!teamDefaults) return;
    
    setResettingToDefaults(true);
    try {
      // Delete meet-specific general rules
      if (rules.id) {
        const { error } = await supabase
          .from('meet_rules')
          .delete()
          .eq('id', rules.id);
        if (error) throw error;
      }

      // Delete meet-specific mat rules
      const { error: matDeleteError } = await supabase
        .from('meet_mat_rules')
        .delete()
        .eq('meet_id', meetId);
      
      if (matDeleteError) throw matDeleteError;

      setRules({ ...teamDefaults });
      setMatRules([...teamMatDefaults]);
      setHasCustomRules(false);
      setHasCustomMatRules(false);
      
      toast({
        title: 'Reset to defaults',
        description: 'Rules have been reset to team defaults',
      });
    } catch (error) {
      console.error('Error resetting rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset rules',
        variant: 'destructive',
      });
    } finally {
      setResettingToDefaults(false);
    }
  };

  const addMatRule = () => {
    if (matRules.length >= 10) return;
    
    const nextNumber = matRules.length > 0 
      ? Math.max(...matRules.map(r => r.mat_number)) + 1 
      : 1;
    
    if (nextNumber > 10) return;

    setMatRules([
      ...matRules,
      {
        mat_number: nextNumber,
        min_experience: 0,
        max_experience: 5,
        min_age: 4,
        max_age: 18,
        min_skill: 0,
        max_skill: 5,
        max_matches: 99,
      },
    ]);
  };

  const removeMatRule = (index: number) => {
    setMatRules(matRules.filter((_, i) => i !== index));
  };

  const updateMatRule = (index: number, field: keyof MatRule, value: number) => {
    const updated = [...matRules];
    updated[index] = { ...updated[index], [field]: value };
    setMatRules(updated);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Meet Pairing Rules</SheetTitle>
          <SheetDescription>
            Configure rules for this meet. {(hasCustomRules || hasCustomMatRules) ? 'Using custom rules.' : 'Using team defaults.'}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 flex-1">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-6 py-6">
              {/* Reset to Defaults Button */}
              {(hasCustomRules || hasCustomMatRules) && (
                <Button
                  variant="outline"
                  onClick={handleResetToDefaults}
                  disabled={resettingToDefaults}
                  className="w-full"
                >
                  {resettingToDefaults ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4 mr-2" />
                  )}
                  Reset to Team Defaults
                </Button>
              )}

              <Separator />

              {/* Priority Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Match Priority</h3>
                <p className="text-xs text-muted-foreground">
                  1 = highest priority when matching wrestlers
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Select
                      value={rules.match_priority_age.toString()}
                      onValueChange={(v) => setRules(r => ({ ...r, match_priority_age: parseInt(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Weight</Label>
                    <Select
                      value={rules.match_priority_weight.toString()}
                      onValueChange={(v) => setRules(r => ({ ...r, match_priority_weight: parseInt(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Experience</Label>
                    <Select
                      value={rules.match_priority_experience.toString()}
                      onValueChange={(v) => setRules(r => ({ ...r, match_priority_experience: parseInt(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Skill</Label>
                    <Select
                      value={rules.match_priority_skill.toString()}
                      onValueChange={(v) => setRules(r => ({ ...r, match_priority_skill: parseInt(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Limits */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Limits</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxAgeDiff">Max age difference (years)</Label>
                    <Input
                      id="maxAgeDiff"
                      type="number"
                      min={0}
                      max={5}
                      value={rules.max_age_diff}
                      onChange={(e) => setRules(r => ({ ...r, max_age_diff: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxMatches">Max matches per wrestler</Label>
                    <Input
                      id="maxMatches"
                      type="number"
                      min={1}
                      max={20}
                      value={rules.max_matches_per_wrestler}
                      onChange={(e) => setRules(r => ({ ...r, max_matches_per_wrestler: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minGap">Min matches gap between assignments</Label>
                    <p className="text-xs text-muted-foreground">
                      Minimum time slots between a wrestler's matches (across all mats)
                    </p>
                    <Input
                      id="minGap"
                      type="number"
                      min={1}
                      max={20}
                      value={rules.conflict_min_gap}
                      onChange={(e) => setRules(r => ({ ...r, conflict_min_gap: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="teammates">Teammates can wrestle</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow same-team matchups
                    </p>
                  </div>
                  <Switch
                    id="teammates"
                    checked={rules.teammates_can_wrestle}
                    onCheckedChange={(v) => setRules(r => ({ ...r, teammates_can_wrestle: v }))}
                  />
                </div>
              </div>

              <Separator />

              {/* Mat Preferences */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Preferred Mat Rules</h3>
                    <p className="text-xs text-muted-foreground">
                      Configure preferred age, experience, and skill ranges per mat. Once all matching wrestlers are assigned, mats become open for remaining matches.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addMatRule}
                    disabled={matRules.length >= 10}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add ({matRules.length}/10)
                  </Button>
                </div>

                {matRules.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground border rounded-lg">
                    <p className="text-sm">No mat preferences configured.</p>
                    <p className="text-xs">All mats will accept any wrestlers.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matRules.map((rule, index) => (
                      <div 
                        key={rule.id || index} 
                        className="p-3 rounded-lg border bg-card/50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Label className="text-muted-foreground">Mat</Label>
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              value={rule.mat_number}
                              onChange={(e) => updateMatRule(index, 'mat_number', parseInt(e.target.value) || 1)}
                              className="w-16 h-8"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMatRule(index)}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Min Age</Label>
                            <Input
                              type="number"
                              min={4}
                              max={99}
                              value={rule.min_age}
                              onChange={(e) => updateMatRule(index, 'min_age', parseInt(e.target.value) || 4)}
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Max Age</Label>
                            <Input
                              type="number"
                              min={4}
                              max={99}
                              value={rule.max_age}
                              onChange={(e) => updateMatRule(index, 'max_age', parseInt(e.target.value) || 18)}
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Max Matches</Label>
                            <Input
                              type="number"
                              min={1}
                              max={99}
                              value={rule.max_matches}
                              onChange={(e) => updateMatRule(index, 'max_matches', Math.min(parseInt(e.target.value) || 99, 99))}
                              className="h-8"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Min Exp</Label>
                            <Input
                              type="number"
                              min={0}
                              max={5}
                              value={rule.min_experience}
                              onChange={(e) => updateMatRule(index, 'min_experience', parseInt(e.target.value) || 0)}
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Max Exp</Label>
                            <Input
                              type="number"
                              min={0}
                              max={5}
                              value={rule.max_experience}
                              onChange={(e) => updateMatRule(index, 'max_experience', parseInt(e.target.value) || 5)}
                              className="h-8"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Min Skill</Label>
                            <Input
                              type="number"
                              min={0}
                              max={5}
                              value={rule.min_skill}
                              onChange={(e) => updateMatRule(index, 'min_skill', parseInt(e.target.value) || 0)}
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Max Skill</Label>
                            <Input
                              type="number"
                              min={0}
                              max={5}
                              value={rule.max_skill}
                              onChange={(e) => updateMatRule(index, 'max_skill', parseInt(e.target.value) || 5)}
                              className="h-8"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Save Button */}
              <div className="flex gap-2 pb-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Rules'
                  )}
                </Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
