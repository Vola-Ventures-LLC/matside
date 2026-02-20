import { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Printer, Users, LayoutGrid } from 'lucide-react';

interface Wrestler {
  id: string;
  first_name: string;
  last_name: string;
  team_id: string;
  team_abbreviation: string;
  team_color: string | null;
  date_of_birth?: string;
  weight?: number;
  experience?: number;
  skill?: number;
  attendance_status?: string;
  match_count?: number;
  is_flagged?: boolean;
  flag_reason?: string | null;
  discussion_flag?: { id: string; note: string | null; team_id: string } | null;
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

interface ParticipatingTeam {
  team_id: string;
  team_name: string;
  abbreviation: string;
  primary_color: string | null;
  is_host: boolean;
}

interface PrintScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetName: string;
  meetDate: string;
  teams: ParticipatingTeam[];
  wrestlers: Wrestler[];
  matches: Match[];
}

export function PrintScheduleDialog({
  open,
  onOpenChange,
  meetName,
  meetDate,
  teams,
  wrestlers,
  matches,
}: PrintScheduleDialogProps) {
  const [activeTab, setActiveTab] = useState<'teams' | 'mats'>('teams');
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [selectedMats, setSelectedMats] = useState<Set<number>>(new Set());
  const printRef = useRef<HTMLDivElement>(null);

  // Sort teams: host first, then alphabetically
  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      if (a.is_host && !b.is_host) return -1;
      if (!a.is_host && b.is_host) return 1;
      return a.team_name.localeCompare(b.team_name);
    });
  }, [teams]);

  // Get unique mat numbers that have matches
  const matNumbers = useMemo(() => {
    const mats = new Set<number>();
    matches.forEach(m => {
      if (m.mat_number) mats.add(m.mat_number);
    });
    return Array.from(mats).sort((a, b) => a - b);
  }, [matches]);

  // Calculate max matches any wrestler has (for team schedule columns)
  const maxMatchCount = useMemo(() => {
    const matchCounts = new Map<string, number>();
    matches.forEach(match => {
      matchCounts.set(match.wrestler_a_id, (matchCounts.get(match.wrestler_a_id) || 0) + 1);
      matchCounts.set(match.wrestler_b_id, (matchCounts.get(match.wrestler_b_id) || 0) + 1);
    });
    return Math.max(...Array.from(matchCounts.values()), 0);
  }, [matches]);

  const toggleTeam = (teamId: string) => {
    const newSet = new Set(selectedTeams);
    if (newSet.has(teamId)) {
      newSet.delete(teamId);
    } else {
      newSet.add(teamId);
    }
    setSelectedTeams(newSet);
  };

  const toggleMat = (matNumber: number) => {
    const newSet = new Set(selectedMats);
    if (newSet.has(matNumber)) {
      newSet.delete(matNumber);
    } else {
      newSet.add(matNumber);
    }
    setSelectedMats(newSet);
  };

  const selectAllTeams = () => {
    setSelectedTeams(new Set(teams.map(t => t.team_id)));
  };

  const selectAllMats = () => {
    setSelectedMats(new Set(matNumbers));
  };

  const clearTeams = () => setSelectedTeams(new Set());
  const clearMats = () => setSelectedMats(new Set());

  // Build team schedule HTML
  const buildTeamScheduleHTML = () => {
    const selectedTeamsList = sortedTeams.filter(t => selectedTeams.has(t.team_id));
    
    return selectedTeamsList.map((team, idx) => {
      const teamWrestlers = wrestlers
        .filter(w => w.team_id === team.team_id)
        .sort((a, b) => a.last_name.localeCompare(b.last_name));

      if (teamWrestlers.length === 0) return '';

      const rows = teamWrestlers.map(wrestler => {
        const wrestlerMatches = matches
          .filter(m => m.wrestler_a_id === wrestler.id || m.wrestler_b_id === wrestler.id)
          .sort((a, b) => {
            // Sort by last 2 digits (time slot) since mats run simultaneously
            const slotA = (a.match_order ?? 0) % 100;
            const slotB = (b.match_order ?? 0) % 100;
            return slotA - slotB;
          });

        const matchCells = Array.from({ length: maxMatchCount }, (_, i) => {
          const match = wrestlerMatches[i];
          return `<td class="match-cell">${match ? match.match_order : '—'}</td>`;
        }).join('');

        return `
          <tr>
            <td class="name-cell">${wrestler.last_name}</td>
            <td class="name-cell">${wrestler.first_name}</td>
            ${matchCells}
          </tr>
        `;
      }).join('');

      const matchHeaders = Array.from({ length: maxMatchCount }, (_, i) => 
        `<th class="match-header">M${i + 1}</th>`
      ).join('');

      return `
        <div class="team-section ${idx > 0 ? 'page-break' : ''}">
          <div class="team-header">${team.team_name} (${team.abbreviation})${team.is_host ? ' ★' : ''}</div>
          <table>
            <thead>
              <tr>
                <th class="name-header">Last Name</th>
                <th class="name-header">First Name</th>
                ${matchHeaders}
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `;
    }).join('');
  };

  // Get contrast color for text on colored background
  const getContrastColor = (hexColor: string | null): string => {
    if (!hexColor) return '#000';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000' : '#fff';
  };

  // Build mat schedule HTML
  const buildMatScheduleHTML = () => {
    const selectedMatsList = Array.from(selectedMats).sort((a, b) => a - b);
    
    return selectedMatsList.map((matNumber, idx) => {
      const matMatches = matches
        .filter(m => m.mat_number === matNumber)
        .sort((a, b) => (a.match_order || 0) - (b.match_order || 0));

      if (matMatches.length === 0) return '';

      const rows = matMatches.map(match => {
        const wrestlerA = match.wrestler_a;
        const wrestlerB = match.wrestler_b;
        
        const nameA = wrestlerA ? `${wrestlerA.first_name} ${wrestlerA.last_name}` : 'TBD';
        const colorA = wrestlerA?.team_color || '#666';
        const textColorA = getContrastColor(colorA);
        const abbrevA = wrestlerA?.team_abbreviation || '';
        
        const nameB = wrestlerB ? `${wrestlerB.first_name} ${wrestlerB.last_name}` : 'TBD';
        const colorB = wrestlerB?.team_color || '#666';
        const textColorB = getContrastColor(colorB);
        const abbrevB = wrestlerB?.team_abbreviation || '';

        return `
          <tr>
            <td class="match-num-cell">${match.match_order || '—'}</td>
            <td class="wrestler-cell">${nameA} <span class="team-badge" style="background-color: ${colorA}; color: ${textColorA};">${abbrevA}</span></td>
            <td class="wrestler-cell">${nameB} <span class="team-badge" style="background-color: ${colorB}; color: ${textColorB};">${abbrevB}</span></td>
          </tr>
        `;
      }).join('');

      return `
        <div class="mat-section ${idx > 0 ? 'page-break' : ''}">
          <div class="mat-header">Mat ${matNumber}</div>
          <table>
            <thead>
              <tr>
                <th class="match-num-header">#</th>
                <th class="wrestler-header">Wrestler 1</th>
                <th class="wrestler-header">Wrestler 2</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `;
    }).join('');
  };

  const handlePrint = () => {
    const content = activeTab === 'teams' ? buildTeamScheduleHTML() : buildMatScheduleHTML();
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const title = activeTab === 'teams' ? 'Team Schedules' : 'Mat Schedules';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${meetName} - ${title}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 11px;
              line-height: 1.4;
              color: #000;
              background: #fff;
              padding: 0.5in;
            }
            .page-break { page-break-before: always; }
            .meet-header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 12px;
              border-bottom: 2px solid #333;
            }
            .meet-title { font-size: 20px; font-weight: bold; }
            .meet-date { font-size: 14px; color: #666; }
            .team-section, .mat-section { margin-bottom: 24px; }
            .team-header, .mat-header {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 8px;
              padding: 8px;
              background: #f0f0f0;
              border-radius: 4px;
            }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; }
            th { background: #f5f5f5; font-weight: 600; }
            .match-cell, .match-header { width: 35px; min-width: 35px; text-align: center; font-size: 10px; }
            .name-cell, .name-header { min-width: 80px; }
            .match-num-cell, .match-num-header { width: 40px; text-align: center; font-weight: 600; }
            .wrestler-cell, .wrestler-header { min-width: 150px; }
            .team-badge { 
              display: inline-block; 
              padding: 1px 6px; 
              border-radius: 4px; 
              font-size: 9px; 
              font-weight: 600; 
              margin-left: 6px;
              vertical-align: middle;
            }
            @media print {
              @page { size: portrait; margin: 0.5in; }
              body { padding: 0; }
              .page-break { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          <div class="meet-header">
            <div class="meet-title">${meetName}</div>
            <div class="meet-date">${meetDate}</div>
          </div>
          ${content}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const canPrint = activeTab === 'teams' ? selectedTeams.size > 0 : selectedMats.size > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Print Schedules</DialogTitle>
          <DialogDescription>
            Select what to print for {meetName}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'teams' | 'mats')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="teams" className="gap-2">
              <Users className="w-4 h-4" />
              Team Schedules
            </TabsTrigger>
            <TabsTrigger value="mats" className="gap-2">
              <LayoutGrid className="w-4 h-4" />
              Mat Schedules
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedTeams.size} of {teams.length} selected
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAllTeams}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={clearTeams}>
                  Clear
                </Button>
              </div>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sortedTeams.map(team => (
                <label
                  key={team.team_id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={selectedTeams.has(team.team_id)}
                    onCheckedChange={() => toggleTeam(team.team_id)}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: team.primary_color || '#666' }}
                  />
                  <span className="flex-1">{team.team_name}</span>
                  {team.is_host && (
                    <span className="text-xs text-muted-foreground">★ Host</span>
                  )}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Each team will print on a separate page with wrestler match numbers.
            </p>
          </TabsContent>

          <TabsContent value="mats" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedMats.size} of {matNumbers.length} selected
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAllMats}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={clearMats}>
                  Clear
                </Button>
              </div>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {matNumbers.map(matNum => {
                const matchCount = matches.filter(m => m.mat_number === matNum).length;
                return (
                  <label
                    key={matNum}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedMats.has(matNum)}
                      onCheckedChange={() => toggleMat(matNum)}
                    />
                    <span className="flex-1">Mat {matNum}</span>
                    <span className="text-xs text-muted-foreground">
                      {matchCount} matches
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Each mat will print on a separate page with match number, wrestlers, and teams.
            </p>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button onClick={handlePrint} disabled={!canPrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Print {activeTab === 'teams' ? 'Team' : 'Mat'} Schedule{(activeTab === 'teams' ? selectedTeams.size : selectedMats.size) > 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
