import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

interface MatchingRulesSettingsProps {
  priorityAge: number;
  setPriorityAge: (value: number) => void;
  priorityWeight: number;
  setPriorityWeight: (value: number) => void;
  priorityExperience: number;
  setPriorityExperience: (value: number) => void;
  prioritySkill: number;
  setPrioritySkill: (value: number) => void;
  maxAgeDiff: number;
  setMaxAgeDiff: (value: number) => void;
  maxMatchesPerWrestler: number;
  setMaxMatchesPerWrestler: (value: number) => void;
  teammatesCanWrestle: boolean;
  setTeammatesCanWrestle: (value: boolean) => void;
  conflictMinMatches: number;
  setConflictMinMatches: (value: number) => void;
  conflictMaxMatches: number;
  setConflictMaxMatches: (value: number) => void;
  conflictMinGap: number;
  setConflictMinGap: (value: number) => void;
}

const priorityOptions = [
  { value: '1', label: '1 (Highest)' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4 (Lowest)' },
];

export function MatchingRulesSettings({
  priorityAge,
  setPriorityAge,
  priorityWeight,
  setPriorityWeight,
  priorityExperience,
  setPriorityExperience,
  prioritySkill,
  setPrioritySkill,
  maxAgeDiff,
  setMaxAgeDiff,
  maxMatchesPerWrestler,
  setMaxMatchesPerWrestler,
  teammatesCanWrestle,
  setTeammatesCanWrestle,
  conflictMinMatches,
  setConflictMinMatches,
  conflictMaxMatches,
  setConflictMaxMatches,
  conflictMinGap,
  setConflictMinGap,
}: MatchingRulesSettingsProps) {
  return (
    <Card className="card-athletic">
      <CardHeader>
        <CardTitle>Default Matching Rules</CardTitle>
        <CardDescription>
          Configure default rules for new meets. Changes won't affect existing meets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Priority Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Relative Importance for Matches</h3>
          <p className="text-xs text-muted-foreground">
            Set the priority order (1 = highest priority) for matching criteria
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Age</Label>
              <Select 
                value={priorityAge.toString()} 
                onValueChange={(v) => setPriorityAge(parseInt(v))}
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
                value={priorityWeight.toString()} 
                onValueChange={(v) => setPriorityWeight(parseInt(v))}
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
                value={priorityExperience.toString()} 
                onValueChange={(v) => setPriorityExperience(parseInt(v))}
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
                value={prioritySkill.toString()} 
                onValueChange={(v) => setPrioritySkill(parseInt(v))}
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

        {/* Limits */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Limits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxAgeDiff">Age discrepancy no more than (years)</Label>
              <Input
                id="maxAgeDiff"
                type="number"
                min={0}
                max={5}
                value={maxAgeDiff}
                onChange={(e) => setMaxAgeDiff(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxMatches">Limit wrestlers to matches per meet</Label>
              <Input
                id="maxMatches"
                type="number"
                min={1}
                max={20}
                value={maxMatchesPerWrestler}
                onChange={(e) => setMaxMatchesPerWrestler(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="teammates">Teammates can wrestle each other</Label>
              <p className="text-xs text-muted-foreground">
                Allow wrestlers from the same team to be matched
              </p>
            </div>
            <Switch
              id="teammates"
              checked={teammatesCanWrestle}
              onCheckedChange={setTeammatesCanWrestle}
            />
          </div>
        </div>

        {/* Conflict Flags */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Flag as Conflict If a Wrestler Has</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="conflictMin">Less than matches</Label>
              <Input
                id="conflictMin"
                type="number"
                min={0}
                max={10}
                value={conflictMinMatches}
                onChange={(e) => setConflictMinMatches(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conflictMax">More than matches</Label>
              <Input
                id="conflictMax"
                type="number"
                min={1}
                max={20}
                value={conflictMaxMatches}
                onChange={(e) => setConflictMaxMatches(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conflictGap">Less than matches gap between assigned</Label>
              <Input
                id="conflictGap"
                type="number"
                min={0}
                max={20}
                value={conflictMinGap}
                onChange={(e) => setConflictMinGap(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
