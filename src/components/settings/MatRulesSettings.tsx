import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

export interface MatRule {
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

interface MatRulesSettingsProps {
  matRules: MatRule[];
  setMatRules: (rules: MatRule[]) => void;
}

export function MatRulesSettings({ matRules, setMatRules }: MatRulesSettingsProps) {
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

  const updateMatRule = (index: number, field: keyof MatRule, value: string | number) => {
    const updated = [...matRules];
    updated[index] = { ...updated[index], [field]: value };
    setMatRules(updated);
  };

  return (
    <Card className="card-athletic">
      <CardHeader>
        <CardTitle>Preferred Mat Rules</CardTitle>
        <CardDescription>
          Configure up to 10 mats with preferred age, experience, and skill ranges. Once all matching wrestlers are assigned, mats become open for remaining matches.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {matRules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No mat preferences configured yet.</p>
            <p className="text-sm">Add mats to define preferred age, experience, and skill ranges.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Rules */}
            {matRules.map((rule, index) => (
              <div 
                key={rule.id || index} 
                className="p-4 rounded-lg border border-border bg-card/50 space-y-4"
              >
                {/* Header row with mat number and delete */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-muted-foreground font-medium">Mat</Label>
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

                {/* Fields in responsive grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Min Age</Label>
                    <Input
                      type="number"
                      min={4}
                      max={99}
                      value={rule.min_age}
                      onChange={(e) => updateMatRule(index, 'min_age', parseInt(e.target.value) || 4)}
                      className="h-9"
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
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Min Exp</Label>
                    <Input
                      type="number"
                      min={0}
                      max={5}
                      value={rule.min_experience}
                      onChange={(e) => updateMatRule(index, 'min_experience', parseInt(e.target.value) || 0)}
                      className="h-9"
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
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Min Skill</Label>
                    <Input
                      type="number"
                      min={0}
                      max={5}
                      value={rule.min_skill}
                      onChange={(e) => updateMatRule(index, 'min_skill', parseInt(e.target.value) || 0)}
                      className="h-9"
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
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1 col-span-2 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Max Matches</Label>
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      value={rule.max_matches}
                      onChange={(e) => updateMatRule(index, 'max_matches', Math.min(parseInt(e.target.value) || 99, 99))}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          onClick={addMatRule}
          disabled={matRules.length >= 10}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Mat ({matRules.length}/10)
        </Button>
      </CardContent>
    </Card>
  );
}
