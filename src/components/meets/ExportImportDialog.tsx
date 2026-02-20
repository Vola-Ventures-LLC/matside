import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Wrestler {
  id: string;
  first_name: string;
  last_name: string;
  team_id: string;
  team_abbreviation: string;
  weight?: number;
  experience?: number;
  skill?: number;
  date_of_birth?: string;
}

interface Match {
  id: string;
  wrestler_a_id: string;
  wrestler_b_id: string;
  mat_number: number | null;
  match_order: number | null;
}

interface ParticipatingTeam {
  team_id: string;
  team_name: string;
  abbreviation: string;
}

interface ExportImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetId: string;
  meetName: string;
  wrestlers: Wrestler[];
  matches: Match[];
  teams: ParticipatingTeam[];
  onPairingsImported: () => void;
}

interface ParsedPairing {
  wrestler_a_name: string;
  wrestler_a_team: string;
  wrestler_b_name: string;
  wrestler_b_team: string;
  mat_number: number;
  match_order: number;
  wrestler_a_id?: string;
  wrestler_b_id?: string;
  error?: string;
}

export function ExportImportDialog({
  open,
  onOpenChange,
  meetId,
  meetName,
  wrestlers,
  matches,
  teams,
  onPairingsImported,
}: ExportImportDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [parsedPairings, setParsedPairings] = useState<ParsedPairing[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  // Calculate age from DOB
  const calculateAge = (dob: string): number => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleExportWrestlers = () => {
    // Build CSV content
    const headers = ['Last Name', 'First Name', 'Team', 'Age', 'Weight', 'Experience', 'Skill'];
    const rows = wrestlers
      .sort((a, b) => {
        const teamCompare = a.team_abbreviation.localeCompare(b.team_abbreviation);
        if (teamCompare !== 0) return teamCompare;
        return a.last_name.localeCompare(b.last_name);
      })
      .map(w => [
        w.last_name,
        w.first_name,
        w.team_abbreviation,
        w.date_of_birth ? calculateAge(w.date_of_birth) : '',
        w.weight ?? '',
        w.experience ?? '',
        w.skill ?? '',
      ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${meetName.replace(/[^a-z0-9]/gi, '_')}_wrestlers.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Wrestlers exported',
      description: `${wrestlers.length} wrestlers exported to CSV`,
    });
  };

  const handleExportTemplate = () => {
    const headers = ['Wrestler A Last Name', 'Wrestler A First Name', 'Wrestler A Team', 'Wrestler B Last Name', 'Wrestler B First Name', 'Wrestler B Team', 'Mat Number', 'Match Order'];
    const exampleRow = ['Smith', 'John', 'ABC', 'Jones', 'Mike', 'XYZ', '1', '101'];
    
    const csvContent = [
      headers.join(','),
      exampleRow.map(cell => `"${cell}"`).join(','),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${meetName.replace(/[^a-z0-9]/gi, '_')}_pairings_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Template downloaded',
      description: 'Fill in the template and import it back',
    });
  };

  const handleExportPairings = () => {
    if (matches.length === 0) {
      toast({
        title: 'No pairings to export',
        description: 'Generate pairings first before exporting',
        variant: 'destructive',
      });
      return;
    }

    const headers = ['Wrestler A Last Name', 'Wrestler A First Name', 'Wrestler A Team', 'Wrestler B Last Name', 'Wrestler B First Name', 'Wrestler B Team', 'Mat Number', 'Match Order'];
    
    const rows = matches
      .sort((a, b) => (a.match_order || 0) - (b.match_order || 0))
      .map(match => {
        const wrestlerA = wrestlers.find(w => w.id === match.wrestler_a_id);
        const wrestlerB = wrestlers.find(w => w.id === match.wrestler_b_id);
        return [
          wrestlerA?.last_name || '',
          wrestlerA?.first_name || '',
          wrestlerA?.team_abbreviation || '',
          wrestlerB?.last_name || '',
          wrestlerB?.first_name || '',
          wrestlerB?.team_abbreviation || '',
          match.mat_number || '',
          match.match_order || '',
        ];
      });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${meetName.replace(/[^a-z0-9]/gi, '_')}_pairings.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Pairings exported',
      description: `${matches.length} matches exported to CSV`,
    });
  };

  const findWrestler = (lastName: string, firstName: string, teamAbbr: string): Wrestler | undefined => {
    const normalizedLast = lastName.trim().toLowerCase();
    const normalizedFirst = firstName.trim().toLowerCase();
    const normalizedTeam = teamAbbr.trim().toUpperCase();

    return wrestlers.find(w => 
      w.last_name.toLowerCase() === normalizedLast &&
      w.first_name.toLowerCase() === normalizedFirst &&
      w.team_abbreviation.toUpperCase() === normalizedTeam
    );
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setParsedPairings([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setImportError('File must contain a header row and at least one data row');
          return;
        }

        // Parse header to find column indices
        const headerLine = lines[0];
        const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
        
        const colIndices = {
          aLast: headers.findIndex(h => h.includes('wrestler a') && h.includes('last')),
          aFirst: headers.findIndex(h => h.includes('wrestler a') && h.includes('first')),
          aTeam: headers.findIndex(h => h.includes('wrestler a') && h.includes('team')),
          bLast: headers.findIndex(h => h.includes('wrestler b') && h.includes('last')),
          bFirst: headers.findIndex(h => h.includes('wrestler b') && h.includes('first')),
          bTeam: headers.findIndex(h => h.includes('wrestler b') && h.includes('team')),
          mat: headers.findIndex(h => h.includes('mat')),
          order: headers.findIndex(h => h.includes('order')),
        };

        // Validate required columns exist
        const missingCols: string[] = [];
        if (colIndices.aLast === -1) missingCols.push('Wrestler A Last Name');
        if (colIndices.aFirst === -1) missingCols.push('Wrestler A First Name');
        if (colIndices.aTeam === -1) missingCols.push('Wrestler A Team');
        if (colIndices.bLast === -1) missingCols.push('Wrestler B Last Name');
        if (colIndices.bFirst === -1) missingCols.push('Wrestler B First Name');
        if (colIndices.bTeam === -1) missingCols.push('Wrestler B Team');
        if (colIndices.mat === -1) missingCols.push('Mat Number');
        if (colIndices.order === -1) missingCols.push('Match Order');

        if (missingCols.length > 0) {
          setImportError(`Missing required columns: ${missingCols.join(', ')}`);
          return;
        }

        // Parse data rows
        const pairings: ParsedPairing[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          if (cols.length < 8) continue;

          const pairing: ParsedPairing = {
            wrestler_a_name: `${cols[colIndices.aLast]}, ${cols[colIndices.aFirst]}`,
            wrestler_a_team: cols[colIndices.aTeam],
            wrestler_b_name: `${cols[colIndices.bLast]}, ${cols[colIndices.bFirst]}`,
            wrestler_b_team: cols[colIndices.bTeam],
            mat_number: parseInt(cols[colIndices.mat]) || 1,
            match_order: parseInt(cols[colIndices.order]) || i,
          };

          // Try to match wrestlers
          const wrestlerA = findWrestler(cols[colIndices.aLast], cols[colIndices.aFirst], cols[colIndices.aTeam]);
          const wrestlerB = findWrestler(cols[colIndices.bLast], cols[colIndices.bFirst], cols[colIndices.bTeam]);

          if (wrestlerA) {
            pairing.wrestler_a_id = wrestlerA.id;
          } else {
            pairing.error = `Wrestler A not found: ${pairing.wrestler_a_name} (${pairing.wrestler_a_team})`;
          }

          if (wrestlerB) {
            pairing.wrestler_b_id = wrestlerB.id;
          } else {
            pairing.error = pairing.error 
              ? `${pairing.error}; Wrestler B not found` 
              : `Wrestler B not found: ${pairing.wrestler_b_name} (${pairing.wrestler_b_team})`;
          }

          pairings.push(pairing);
        }

        setParsedPairings(pairings);
      } catch (err) {
        setImportError('Failed to parse CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleImport = async () => {
    const validPairings = parsedPairings.filter(p => p.wrestler_a_id && p.wrestler_b_id);
    
    if (validPairings.length === 0) {
      toast({
        title: 'No valid pairings',
        description: 'All pairings have matching errors. Please fix the CSV and try again.',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);

    try {
      // If replacing, delete existing matches first
      if (importMode === 'replace') {
        const { error: deleteError } = await supabase
          .from('matches')
          .delete()
          .eq('meet_id', meetId);

        if (deleteError) throw deleteError;
      }

      // Insert new matches
      const matchesToInsert = validPairings.map(p => ({
        meet_id: meetId,
        wrestler_a_id: p.wrestler_a_id!,
        wrestler_b_id: p.wrestler_b_id!,
        mat_number: p.mat_number,
        match_order: p.match_order,
        status: 'pending',
      }));

      const { error: insertError } = await supabase
        .from('matches')
        .insert(matchesToInsert);

      if (insertError) throw insertError;

      toast({
        title: 'Pairings imported',
        description: `${validPairings.length} matches imported successfully`,
      });

      onPairingsImported();
      onOpenChange(false);
      setParsedPairings([]);
    } catch (err: any) {
      toast({
        title: 'Import failed',
        description: err.message || 'Failed to import pairings',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedPairings.filter(p => !p.error).length;
  const errorCount = parsedPairings.filter(p => p.error).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Export / Import Pairings</DialogTitle>
          <DialogDescription>
            Export wrestlers for external pairing, or import pairings from a CSV file
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'export' | 'import')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2">
              <Upload className="w-4 h-4" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-medium">Wrestler List</h4>
                <p className="text-sm text-muted-foreground">
                  Export all {wrestlers.length} wrestlers with their attributes (name, team, age, weight, experience, skill)
                </p>
                <Button onClick={handleExportWrestlers} className="w-full gap-2">
                  <Download className="w-4 h-4" />
                  Download Wrestlers CSV
                </Button>
              </div>

              {matches.length > 0 && (
                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-medium">Current Pairings</h4>
                  <p className="text-sm text-muted-foreground">
                    Export all {matches.length} current matches to edit externally
                  </p>
                  <Button onClick={handleExportPairings} className="w-full gap-2">
                    <Download className="w-4 h-4" />
                    Download Pairings CSV
                  </Button>
                </div>
              )}

              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-medium">Blank Template</h4>
                <p className="text-sm text-muted-foreground">
                  Download an empty template to create pairings from scratch
                </p>
                <Button variant="outline" onClick={handleExportTemplate} className="w-full gap-2">
                  <Download className="w-4 h-4" />
                  Download Template CSV
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Import Mode</Label>
                <RadioGroup
                  value={importMode}
                  onValueChange={(v) => setImportMode(v as 'replace' | 'merge')}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="replace" id="replace" />
                    <Label htmlFor="replace" className="font-normal">
                      Replace all existing pairings
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="merge" id="merge" />
                    <Label htmlFor="merge" className="font-normal">
                      Add to existing pairings
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Select CSV File
                </Button>
              </div>

              {importError && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>{importError}</AlertDescription>
                </Alert>
              )}

              {parsedPairings.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-primary">
                      <CheckCircle2 className="w-4 h-4" />
                      {validCount} valid
                    </span>
                    {errorCount > 0 && (
                      <span className="flex items-center gap-1 text-destructive">
                        <AlertTriangle className="w-4 h-4" />
                        {errorCount} errors
                      </span>
                    )}
                  </div>

                  {errorCount > 0 && (
                    <div className="max-h-32 overflow-y-auto text-xs space-y-1 p-2 bg-muted rounded">
                      {parsedPairings.filter(p => p.error).map((p, i) => (
                        <div key={i} className="text-destructive">
                          Row {i + 2}: {p.error}
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    onClick={handleImport}
                    disabled={validCount === 0 || importing}
                    className="w-full gap-2"
                  >
                    {importing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Import {validCount} Pairings
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
