import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, UserX, ArrowRightLeft, Plus, Minus, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';

interface AuditEntry {
  id: string;
  meet_id: string;
  team_id: string;
  wrestler_id: string | null;
  match_id: string | null;
  changed_by: string;
  action: string;
  old_value: any;
  new_value: any;
  description: string;
  created_at: string;
  team_name?: string;
  team_abbreviation?: string;
  team_color?: string;
  changed_by_name?: string;
}

interface Team {
  team_id: string;
  team_name: string;
  abbreviation: string;
  primary_color: string | null;
}

interface AuditTrailSheetProps {
  meetId: string;
  teams: Team[];
  isHost: boolean;
  currentTeamId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const actionConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  scratch: { icon: <UserX className="w-4 h-4" />, color: 'text-red-400' },
  match_changed: { icon: <ArrowRightLeft className="w-4 h-4" />, color: 'text-yellow-400' },
  match_added: { icon: <Plus className="w-4 h-4" />, color: 'text-green-400' },
  match_removed: { icon: <Minus className="w-4 h-4" />, color: 'text-red-400' },
  approved: { icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-400' },
  rejected: { icon: <XCircle className="w-4 h-4" />, color: 'text-red-400' },
};

export function AuditTrailSheet({
  meetId,
  teams,
  isHost,
  currentTeamId,
  open,
  onOpenChange,
}: AuditTrailSheetProps) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [teamFilter, setTeamFilter] = useState<string>('all');

  useEffect(() => {
    if (open) {
      fetchAuditEntries();
    }
  }, [open, meetId]);

  const fetchAuditEntries = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('pairing_audit')
      .select('*')
      .eq('meet_id', meetId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audit entries:', error);
      setLoading(false);
      return;
    }

    // Enrich with team and user info
    const teamIds = [...new Set(data.map(e => e.team_id))];
    const userIds = [...new Set(data.map(e => e.changed_by))];

    const [teamsRes, profilesRes] = await Promise.all([
      supabase.from('teams').select('id, name, abbreviation, primary_color').in('id', teamIds),
      supabase.from('profiles').select('user_id, full_name').in('user_id', userIds),
    ]);

    const teamMap = new Map(teamsRes.data?.map(t => [t.id, t]) || []);
    const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p.full_name]) || []);

    const enriched: AuditEntry[] = data.map(e => {
      const team = teamMap.get(e.team_id);
      return {
        ...e,
        team_name: team?.name,
        team_abbreviation: team?.abbreviation,
        team_color: team?.primary_color,
        changed_by_name: profileMap.get(e.changed_by) || 'Unknown',
      };
    });

    setEntries(enriched);
    setLoading(false);
  };

  const filteredEntries = entries.filter(e => {
    if (teamFilter === 'all') return true;
    return e.team_id === teamFilter;
  });

  const getContrastColor = (hexColor: string | null) => {
    if (!hexColor) return 'hsl(var(--foreground))';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  // Only show teams relevant to the current user
  const visibleTeams = isHost ? teams : teams.filter(t => t.team_id === currentTeamId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Audit Trail</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Team Filter (host only if multiple teams) */}
          {isHost && teams.length > 1 && (
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team.team_id} value={team.team_id}>
                    {team.abbreviation} - {team.team_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Entries List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No changes recorded yet.</p>
              <p className="text-sm mt-1">Changes are tracked after the status is set to "Planned".</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-3 pr-4">
                {filteredEntries.map(entry => {
                  const config = actionConfig[entry.action] || { icon: null, color: 'text-muted-foreground' };
                  return (
                    <div
                      key={entry.id}
                      className="p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${config.color}`}>
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{entry.description}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge
                              className="text-xs"
                              style={{
                                backgroundColor: entry.team_color || 'hsl(var(--muted))',
                                color: getContrastColor(entry.team_color || null),
                              }}
                            >
                              {entry.team_abbreviation}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              by {entry.changed_by_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(entry.created_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
