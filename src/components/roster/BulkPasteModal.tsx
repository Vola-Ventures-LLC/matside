import { useState, useMemo } from 'react';
import { useTeam } from '@/contexts/TeamContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2, Link2, UserPlus } from 'lucide-react';
import { findPotentialMatches, findExactMatch } from '@/lib/wrestlerMatching';

interface Wrestler {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  weight: number;
  experience: number;
  skill: number;
}

interface BulkPasteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  existingWrestlers?: Wrestler[];
  currentSeasonId?: string | null;
  onAddToSeason?: (wrestlerId: string) => Promise<boolean>;
}

interface ParsedWrestler {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  weight: number;
  experience: number;
  skill: number;
  valid: boolean;
  error?: string;
  matchedWrestler?: Wrestler | null;
  potentialMatches?: { wrestler: Wrestler; score: number }[];
  action?: 'create' | 'link';
}

export function BulkPasteModal({ 
  open, 
  onOpenChange, 
  onSuccess,
  existingWrestlers = [],
  currentSeasonId,
  onAddToSeason,
}: BulkPasteModalProps) {
  const { currentTeam } = useTeam();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [parsedData, setParsedData] = useState<ParsedWrestler[]>([]);
  const [isParsed, setIsParsed] = useState(false);

  const parseDate = (dateStr: string): string | null => {
    // Try various date formats
    const formats = [
      /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // MM/DD/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // M/D/YYYY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[0]) {
          return dateStr; // Already in correct format
        }
        // Convert MM/DD/YYYY to YYYY-MM-DD
        const month = match[1].padStart(2, '0');
        const day = match[2].padStart(2, '0');
        const year = match[3];
        return `${year}-${month}-${day}`;
      }
    }
    return null;
  };

  const handleParse = () => {
    const lines = pasteContent.trim().split('\n');
    const parsed: ParsedWrestler[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      // Split by tab or multiple spaces
      const parts = line.split(/\t|  +/).map(p => p.trim()).filter(Boolean);
      
      if (parts.length < 4) {
        parsed.push({
          first_name: parts[0] || '',
          last_name: parts[1] || '',
          date_of_birth: '',
          weight: 0,
          experience: 2,
          skill: 2,
          valid: false,
          error: 'Not enough columns. Need: First Name, Last Name, DOB, Weight',
        });
        continue;
      }

      const [firstName, lastName, dobStr, weightStr, expStr, skillStr] = parts;
      const dob = parseDate(dobStr);
      const weight = parseFloat(weightStr);
      const experience = expStr ? Math.min(5, Math.max(0, parseInt(expStr) || 2)) : 2;
      const skill = skillStr ? Math.min(4, Math.max(0, parseInt(skillStr) || 2)) : 2;

      const errors: string[] = [];
      if (!dob) errors.push('Invalid date format');
      if (isNaN(weight) || weight < 30 || weight > 350) errors.push('Invalid weight');

      // Check for matches with existing wrestlers
      const wrestlerData = { first_name: firstName, last_name: lastName, date_of_birth: dob || '' };
      const exactMatch = dob ? findExactMatch(wrestlerData, existingWrestlers) : null;
      const potentialMatches = dob ? findPotentialMatches(wrestlerData, existingWrestlers, 60) : [];

      parsed.push({
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dob || '',
        weight: weight || 0,
        experience,
        skill,
        valid: errors.length === 0,
        error: errors.join(', '),
        matchedWrestler: exactMatch,
        potentialMatches: exactMatch ? [] : potentialMatches,
        action: exactMatch ? 'link' : (potentialMatches.length > 0 ? 'link' : 'create'),
      });
    }

    setParsedData(parsed);
    setIsParsed(true);
  };

  const handleSetAction = (idx: number, action: 'create' | 'link', wrestlerId?: string) => {
    setParsedData(prev => prev.map((w, i) => {
      if (i !== idx) return w;
      if (action === 'link' && wrestlerId) {
        const matched = existingWrestlers.find(ew => ew.id === wrestlerId);
        return { ...w, action, matchedWrestler: matched || null };
      }
      return { ...w, action, matchedWrestler: null };
    }));
  };

  const handleSubmit = async () => {
    if (!currentTeam) return;

    const validWrestlers = parsedData.filter(w => w.valid);
    if (validWrestlers.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No valid wrestlers',
        description: 'Please fix the errors and try again.',
      });
      return;
    }

    setLoading(true);

    // Separate new wrestlers from linked ones
    const toCreate = validWrestlers.filter(w => w.action === 'create');
    const toLink = validWrestlers.filter(w => w.action === 'link' && w.matchedWrestler);

    let createdCount = 0;
    let linkedCount = 0;

    // Create new wrestlers
    if (toCreate.length > 0) {
      const { data: newWrestlers, error } = await supabase.from('wrestlers').insert(
        toCreate.map(w => ({
          team_id: currentTeam.id,
          first_name: w.first_name,
          last_name: w.last_name,
          date_of_birth: w.date_of_birth,
          weight: w.weight,
          experience: w.experience,
          skill: w.skill,
        }))
      ).select();

      if (error) {
        setLoading(false);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to add wrestlers. Please try again.',
        });
        return;
      }

      createdCount = newWrestlers?.length || 0;

      // Add new wrestlers to current season
      if (currentSeasonId && onAddToSeason && newWrestlers) {
        for (const wrestler of newWrestlers) {
          await onAddToSeason(wrestler.id);
        }
      }
    }

    // Link existing wrestlers to current season
    if (toLink.length > 0 && currentSeasonId && onAddToSeason) {
      for (const w of toLink) {
        if (w.matchedWrestler) {
          await onAddToSeason(w.matchedWrestler.id);
          linkedCount++;
        }
      }
    }

    setLoading(false);
    
    const messages = [];
    if (createdCount > 0) messages.push(`${createdCount} new`);
    if (linkedCount > 0) messages.push(`${linkedCount} linked`);

    toast({
      title: 'Wrestlers added!',
      description: `${messages.join(', ')} wrestler(s) added to the roster.`,
    });
    
    setPasteContent('');
    setParsedData([]);
    setIsParsed(false);
    onOpenChange(false);
    onSuccess();
  };

  const resetModal = () => {
    setPasteContent('');
    setParsedData([]);
    setIsParsed(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetModal();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Paste Wrestlers</DialogTitle>
          <DialogDescription>
            Paste rows from Excel or a spreadsheet. Each row should have: First Name, Last Name, DOB, Weight (and optionally Experience 0-5, Skill 0-4)
          </DialogDescription>
        </DialogHeader>

        {!isParsed ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pasteArea">Paste Data</Label>
              <Textarea
                id="pasteArea"
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="John	Smith	01/15/2012	85	3	2
Jane	Doe	2013-03-20	72	2	2"
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Format:</strong> Tab-separated columns<br />
                <strong>Required:</strong> First Name, Last Name, DOB (MM/DD/YYYY or YYYY-MM-DD), Weight<br />
                <strong>Optional:</strong> Experience (0-5), Skill (0-4)
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 btn-primary" 
                onClick={handleParse}
                disabled={!pasteContent.trim()}
              >
                Preview
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="max-h-64 overflow-y-auto space-y-2">
              {parsedData.map((wrestler, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    wrestler.valid 
                      ? 'border-success/30 bg-success/10' 
                      : 'border-destructive/30 bg-destructive/10'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {wrestler.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {wrestler.first_name} {wrestler.last_name}
                      </p>
                      {wrestler.valid ? (
                        <p className="text-xs text-muted-foreground">
                          {wrestler.weight} lbs • DOB: {wrestler.date_of_birth}
                        </p>
                      ) : (
                        <p className="text-xs text-destructive">{wrestler.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-sm">
                <span className="text-success font-medium">
                  {parsedData.filter(w => w.valid).length} valid
                </span>
                {' • '}
                <span className="text-destructive font-medium">
                  {parsedData.filter(w => !w.valid).length} errors
                </span>
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsParsed(false)}
              >
                Back
              </Button>
              <Button 
                className="flex-1 btn-primary" 
                onClick={handleSubmit}
                disabled={loading || parsedData.filter(w => w.valid).length === 0}
              >
                {loading ? 'Adding...' : `Add ${parsedData.filter(w => w.valid).length} Wrestlers`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
