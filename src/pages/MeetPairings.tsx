import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTeam } from '@/contexts/TeamContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Shuffle,
  Loader2,
  AlertTriangle,
  Users,
  Search,
  ChevronDown,
  ChevronUp,
  Flag,
  UserX,
  RefreshCw,
  Trash2,
  MessageSquare,
  Pencil,
  Printer,
  MoreVertical,
} from 'lucide-react';
import { format, parseISO, differenceInYears } from 'date-fns';
import { WrestlerFlagDialog } from '@/components/meets/WrestlerFlagDialog';
import { EditMatchSheet } from '@/components/meets/EditMatchSheet';
import { MeetRulesSheet } from '@/components/meets/MeetRulesSheet';
import { PrintScheduleDialog } from '@/components/meets/PrintScheduleDialog';
import { ExportImportDialog } from '@/components/meets/ExportImportDialog';
import { MatColumnsView } from '@/components/meets/MatColumnsView';
import { AddMatchSheet } from '@/components/meets/AddMatchSheet';
import { PairingStatusBar } from '@/components/meets/PairingStatusBar';
import { AuditTrailSheet } from '@/components/meets/AuditTrailSheet';
import { ApprovalQueueSheet } from '@/components/meets/ApprovalQueueSheet';
import { GenerationReportSheet, type ZeroMatchWrestler } from '@/components/meets/GenerationReportSheet';
import { ScratchWrestlerDialog } from '@/components/meets/ScratchWrestlerDialog';
import { ChangesSummarySheet } from '@/components/meets/ChangesSummarySheet';
import { Settings2, FileSpreadsheet, LayoutGrid, Maximize2, Minimize2, UserPlus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
interface DiscussionFlag {
  id: string;
  note: string | null;
  team_id: string;
}

type PairingStatus = 'draft' | 'planned' | 'published';

interface Meet {
  id: string;
  name: string;
  meet_date: string;
  meet_time: string | null;
  status: string;
  host_team_id: string;
  pairing_status: PairingStatus;
}

interface ParticipatingTeam {
  team_id: string;
  team_name: string;
  abbreviation: string;
  primary_color: string | null;
  attending_count: number;
  unconfirmed_count: number;
  is_host: boolean;
}

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
  is_flagged: boolean;
  flag_severity: 'critical' | 'warning' | null;
  flag_reason: string | null;
  discussion_flag: DiscussionFlag | null;
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
  needs_replacement: boolean;
  scratched_wrestler_id: string | null;
}

type SortField = 'last_name' | 'first_name' | 'age' | 'weight' | 'experience' | 'skill' | 'match_count' | 'team' | 'attendance' | 'flagged';
type SortDirection = 'asc' | 'desc';

export function getFlagSeverity(
  matchCount: number,
  attendanceStatus: string,
  totalMatchesGenerated: number,
): 'critical' | 'warning' | null {
  if (totalMatchesGenerated === 0) return null;
  const isAttending = ['attending', 'arriving_late', 'leaving_early'].includes(attendanceStatus);
  if (matchCount === 0 && isAttending) return 'critical';
  if (matchCount < 2 && isAttending) return 'warning';
  if (matchCount > 5) return 'warning';
  return null;
}

export default function MeetPairings() {
  const { meetId } = useParams<{ meetId: string }>();
  const navigate = useNavigate();
  const { currentTeam } = useTeam();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [meet, setMeet] = useState<Meet | null>(null);
  const [teams, setTeams] = useState<ParticipatingTeam[]>([]);
  const [wrestlers, setWrestlers] = useState<Wrestler[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [resetting, setResetting] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [attendanceFilter, setAttendanceFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('last_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedWrestlerId, setSelectedWrestlerId] = useState<string | null>(null);
  const [flagDialogWrestler, setFlagDialogWrestler] = useState<Wrestler | null>(null);
  const [scratchMatch, setScratchMatch] = useState<Match | null>(null);
  const [scratchWrestlerId, setScratchWrestlerId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'scratch' | 'change'>('scratch');
  const [rulesSheetOpen, setRulesSheetOpen] = useState(false);
  const [printScheduleOpen, setPrintScheduleOpen] = useState(false);
  const [exportImportOpen, setExportImportOpen] = useState(false);
  const [matFilter, setMatFilter] = useState<string>('all');
  const [matColumnsFullScreen, setMatColumnsFullScreen] = useState(false);
  const [conflictMinGap, setConflictMinGap] = useState<number>(7);
  const [addMatchWrestler, setAddMatchWrestler] = useState<Wrestler | null>(null);
  const [matRules, setMatRules] = useState<{ mat_number: number; min_age: number; max_age: number; min_experience: number; max_experience: number; min_skill: number; max_skill: number; max_matches: number }[]>([]);
  
  // Generation report state
  const [generationReportOpen, setGenerationReportOpen] = useState(false);
  const [generationReportData, setGenerationReportData] = useState<{
    matchesCreated: number;
    wrestlersWithZeroMatches: ZeroMatchWrestler[];
  } | null>(null);

  // Session-local set of match IDs created by incremental generation (for "New" badge)
  const [newMatchIds, setNewMatchIds] = useState<Set<string>>(new Set());
  const [generatingIncremental, setGeneratingIncremental] = useState(false);

  // Pairing status state
  const [auditSheetOpen, setAuditSheetOpen] = useState(false);
  const [approvalQueueOpen, setApprovalQueueOpen] = useState(false);
  const [summarySheetOpen, setSummarySheetOpen] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [scratchWrestlerDialogOpen, setScratchWrestlerDialogOpen] = useState(false);
  const [wrestlerToScratch, setWrestlerToScratch] = useState<Wrestler | null>(null);

  useEffect(() => {
    if (meetId && currentTeam) {
      fetchData();
    }
  }, [meetId, currentTeam]);

  const fetchData = async () => {
    if (!meetId || !currentTeam) return;
    setLoading(true);

    // Fetch meet details
    const { data: meetData, error: meetError } = await supabase
      .from('meets')
      .select('id, name, meet_date, meet_time, status, host_team_id, pairing_status')
      .eq('id', meetId)
      .single();

    if (meetError || !meetData) {
      toast({ title: 'Error', description: 'Meet not found', variant: 'destructive' });
      navigate('/meets');
      return;
    }
    setMeet(meetData as Meet);

    // Fetch participating teams (including host), meet rules, and mat rules
    const [meetTeamsRes, hostTeamRes, meetRulesRes, teamRulesRes, meetMatRulesRes, teamMatRulesRes] = await Promise.all([
      supabase
        .from('meet_teams')
        .select(`team_id, teams (id, name, abbreviation, primary_color)`)
        .eq('meet_id', meetId),
      supabase
        .from('teams')
        .select('id, name, abbreviation, primary_color, conflict_min_gap')
        .eq('id', meetData.host_team_id)
        .single(),
      supabase
        .from('meet_rules')
        .select('conflict_min_gap')
        .eq('meet_id', meetId)
        .maybeSingle(),
      supabase
        .from('teams')
        .select('conflict_min_gap')
        .eq('id', meetData.host_team_id)
        .single(),
      supabase
        .from('meet_mat_rules')
        .select('mat_number, min_age, max_age, min_experience, max_experience, min_skill, max_skill, max_matches')
        .eq('meet_id', meetId)
        .order('mat_number', { ascending: true }),
      supabase
        .from('mat_rules')
        .select('mat_number, min_age, max_age, min_experience, max_experience, min_skill, max_skill, max_matches')
        .eq('team_id', meetData.host_team_id)
        .order('mat_number', { ascending: true }),
    ]);

    // Set conflict_min_gap from meet rules, or fall back to team default
    const gap = meetRulesRes.data?.conflict_min_gap ?? teamRulesRes.data?.conflict_min_gap ?? 7;
    setConflictMinGap(gap);

    // Set mat rules from meet-specific or team default
    const fetchedMatRules = meetMatRulesRes.data && meetMatRulesRes.data.length > 0 
      ? meetMatRulesRes.data 
      : teamMatRulesRes.data || [];
    setMatRules(fetchedMatRules);

    const allTeamIds = new Set<string>();
    meetTeamsRes.data?.forEach(t => allTeamIds.add(t.team_id));
    if (hostTeamRes.data) allTeamIds.add(hostTeamRes.data.id);

    // Fetch attendance for all teams
    const { data: attendanceData } = await supabase
      .from('meet_attendance')
      .select('wrestler_id, team_id, status')
      .eq('meet_id', meetId);

    const attendanceMap = new Map<string, string>();
    const teamAttendance: Record<string, { attending: number; unconfirmed: number }> = {};
    
    attendanceData?.forEach(a => {
      attendanceMap.set(a.wrestler_id, a.status);
      if (!teamAttendance[a.team_id]) {
        teamAttendance[a.team_id] = { attending: 0, unconfirmed: 0 };
      }
      if (['attending', 'arriving_late', 'leaving_early'].includes(a.status)) {
        teamAttendance[a.team_id].attending++;
      } else if (['unconfirmed', 'pending'].includes(a.status)) {
        teamAttendance[a.team_id].unconfirmed++;
      }
    });

    // Build teams list
    const teamsWithAttendance: ParticipatingTeam[] = [];
    
    if (hostTeamRes.data) {
      teamsWithAttendance.push({
        team_id: hostTeamRes.data.id,
        team_name: hostTeamRes.data.name,
        abbreviation: hostTeamRes.data.abbreviation,
        primary_color: hostTeamRes.data.primary_color,
        attending_count: teamAttendance[hostTeamRes.data.id]?.attending || 0,
        unconfirmed_count: teamAttendance[hostTeamRes.data.id]?.unconfirmed || 0,
        is_host: true,
      });
    }

    meetTeamsRes.data?.forEach(mt => {
      if (!mt.teams) return;
      // Skip if this team is already added as host
      if (mt.team_id === meetData.host_team_id) return;
      const team = mt.teams as any;
      teamsWithAttendance.push({
        team_id: team.id,
        team_name: team.name,
        abbreviation: team.abbreviation,
        primary_color: team.primary_color,
        attending_count: teamAttendance[team.id]?.attending || 0,
        unconfirmed_count: teamAttendance[team.id]?.unconfirmed || 0,
        is_host: false,
      });
    });
    setTeams(teamsWithAttendance);

    // Fetch wrestlers from all teams
    const teamIds = Array.from(allTeamIds);
    const { data: wrestlersData } = await supabase
      .from('wrestlers')
      .select('id, first_name, last_name, date_of_birth, weight, experience, skill, team_id, status')
      .in('team_id', teamIds)
      .eq('status', 'active');

    // Fetch teams info for wrestlers
    const { data: teamsInfo } = await supabase
      .from('teams')
      .select('id, abbreviation, primary_color')
      .in('id', teamIds);

    const teamInfoMap = new Map(teamsInfo?.map(t => [t.id, t]) || []);

    // Fetch matches
    const { data: matchesData } = await supabase
      .from('matches')
      .select('id, wrestler_a_id, wrestler_b_id, mat_number, match_order, status, scratched_wrestler_id')
      .eq('meet_id', meetId)
      .order('match_order', { ascending: true });

    // Fetch discussion flags
    const { data: flagsData } = await supabase
      .from('wrestler_flags')
      .select('id, wrestler_id, note, team_id')
      .eq('meet_id', meetId);
    
    const flagsMap = new Map<string, DiscussionFlag>();
    flagsData?.forEach(f => {
      flagsMap.set(f.wrestler_id, {
        id: f.id,
        note: f.note,
        team_id: f.team_id,
      });
    });

    // Count matches per wrestler
    const matchCounts: Record<string, number> = {};
    matchesData?.forEach(m => {
      matchCounts[m.wrestler_a_id] = (matchCounts[m.wrestler_a_id] || 0) + 1;
      matchCounts[m.wrestler_b_id] = (matchCounts[m.wrestler_b_id] || 0) + 1;
    });

    // Build wrestlers list
    const wrestlersList: Wrestler[] = (wrestlersData || []).map(w => {
      const teamInfo = teamInfoMap.get(w.team_id);
      const status = attendanceMap.get(w.id) || 'unconfirmed';
      const matchCount = matchCounts[w.id] || 0;
      const discussionFlag = flagsMap.get(w.id) || null;
      
      // Flag logic - only flag when matches have been generated
      const totalMatchesGenerated = Object.values(matchCounts).reduce((sum, c) => sum + c, 0) / 2;
      const flagSeverity = getFlagSeverity(matchCount, status, totalMatchesGenerated);
      const isFlagged = flagSeverity !== null;
      let flagReason: string | null = null;
      if (flagSeverity === 'critical') {
        flagReason = 'No match assigned';
      } else if (flagSeverity === 'warning' && matchCount < 2) {
        flagReason = `Only ${matchCount} match${matchCount === 1 ? '' : 'es'}`;
      } else if (flagSeverity === 'warning' && matchCount > 5) {
        flagReason = `${matchCount} matches (max recommended: 5)`;
      }

      return {
        id: w.id,
        first_name: w.first_name,
        last_name: w.last_name,
        date_of_birth: w.date_of_birth,
        weight: w.weight,
        experience: w.experience,
        skill: w.skill,
        team_id: w.team_id,
        team_abbreviation: teamInfo?.abbreviation || '',
        team_color: teamInfo?.primary_color || null,
        attendance_status: status,
        match_count: matchCount,
        is_flagged: isFlagged,
        flag_severity: flagSeverity,
        flag_reason: flagReason,
        discussion_flag: discussionFlag,
      };
    });
    setWrestlers(wrestlersList);

    // Enrich matches with wrestler data
    const wrestlerMap = new Map(wrestlersList.map(w => [w.id, w]));
    const enrichedMatches: Match[] = (matchesData || []).map(m => ({
      ...m,
      wrestler_a: wrestlerMap.get(m.wrestler_a_id) || null,
      wrestler_b: wrestlerMap.get(m.wrestler_b_id) || null,
      needs_replacement: false,
      scratched_wrestler_id: m.scratched_wrestler_id || null,
    }));
    setMatches(enrichedMatches);

    // Fetch pending approvals count (for host)
    if (meetData.host_team_id === currentTeam.id) {
      const { count } = await supabase
        .from('scratch_suggestions')
        .select('id', { count: 'exact', head: true })
        .eq('meet_id', meetId)
        .eq('status', 'pending');
      setPendingApprovals(count || 0);
    }

    // Fetch public token if published
    if (meetData.pairing_status === 'published') {
      const { data: tokenData } = await supabase
        .from('public_meet_tokens')
        .select('token')
        .eq('meet_id', meetId)
        .maybeSingle();
      setPublicToken(tokenData?.token || null);
    } else {
      setPublicToken(null);
    }

    setLoading(false);
  };

  const generatePairings = async () => {
    if (!meet || !currentTeam) return;
    setGenerating(true);

    try {
      const response = await supabase.functions.invoke('generate-pairings', {
        body: { meet_id: meet.id, host_team_id: currentTeam.id },
      });

      if (response.error) throw new Error(response.error.message);

      const matchesCreated = response.data?.matches_created || 0;
      const wrestlersWithZeroMatches: ZeroMatchWrestler[] = response.data?.wrestlers_with_zero_matches || [];

      toast({
        title: 'Pairings generated!',
        description: `Created ${matchesCreated} match${matchesCreated !== 1 ? 'es' : ''}.${wrestlersWithZeroMatches.length > 0 ? ` ${wrestlersWithZeroMatches.length} wrestler${wrestlersWithZeroMatches.length !== 1 ? 's' : ''} unmatched.` : ''}`,
        variant: wrestlersWithZeroMatches.length > 0 ? 'destructive' : 'default',
      });

      setGenerationReportData({ matchesCreated, wrestlersWithZeroMatches });
      setGenerationReportOpen(true);
      fetchData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setGenerating(false);
    }
  };

  const generateIncrementalPairings = async () => {
    if (!meet || !currentTeam) return;
    setGeneratingIncremental(true);

    try {
      const response = await supabase.functions.invoke('generate-pairings', {
        body: { meet_id: meet.id, host_team_id: currentTeam.id, incremental: true },
      });

      if (response.error) throw new Error(response.error.message);

      const matchesCreated = response.data?.matches_created || 0;
      const wrestlersWithZeroMatches: ZeroMatchWrestler[] = response.data?.wrestlers_with_zero_matches || [];
      const returnedNewIds: string[] = response.data?.new_match_ids || [];

      // Merge new IDs into the session-local set
      setNewMatchIds(prev => new Set([...prev, ...returnedNewIds]));

      toast({
        title: matchesCreated > 0 ? 'New wrestlers matched!' : 'No new matches added',
        description: matchesCreated > 0
          ? `Added ${matchesCreated} new match${matchesCreated !== 1 ? 'es' : ''}.${wrestlersWithZeroMatches.length > 0 ? ` ${wrestlersWithZeroMatches.length} still unmatched.` : ''}`
          : response.data?.message || 'All attending wrestlers already have matches.',
        variant: wrestlersWithZeroMatches.length > 0 ? 'destructive' : 'default',
      });

      setGenerationReportData({ matchesCreated, wrestlersWithZeroMatches });
      setGenerationReportOpen(true);
      fetchData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setGeneratingIncremental(false);
    }
  };

  const resetPairings = async () => {
    if (!meet) return;
    setResetting(true);

    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('meet_id', meet.id);

      if (error) throw error;

      toast({
        title: 'Pairings reset',
        description: 'All matches have been deleted. You can now regenerate pairings.',
      });
      fetchData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setResetting(false);
    }
  };

  const handleMatchesReorder = async (updates: { id: string; mat_number: number; match_order: number }[]) => {
    try {
      // Update each match in the database
      for (const update of updates) {
        const { error } = await supabase
          .from('matches')
          .update({
            mat_number: update.mat_number,
            match_order: update.match_order,
          })
          .eq('id', update.id);
        
        if (error) throw error;
      }

      // Don't call fetchData() - MatColumnsView manages its own local state for smooth UX
      // The database is updated, and the component will sync when user navigates away and back
    } catch (error: any) {
      console.error('Error reordering matches:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reorder matches.',
      });
      // Refresh on error to restore correct state
      fetchData();
    }
  };

  const getAge = (dob: string) => differenceInYears(new Date(), parseISO(dob));

  const getContrastColor = (hexColor: string | null) => {
    if (!hexColor) return 'hsl(var(--foreground))';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const getAttendanceBadge = (status: string) => {
    switch (status) {
      case 'attending':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Confirmed</Badge>;
      case 'arriving_late':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Late</Badge>;
      case 'leaving_early':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Early</Badge>;
      case 'not_attending':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Not Attending</Badge>;
      default:
        return <Badge variant="outline">Unconfirmed</Badge>;
    }
  };

  // Filtering and sorting
  const filteredWrestlers = useMemo(() => {
    let result = [...wrestlers];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(w =>
        w.first_name.toLowerCase().includes(term) ||
        w.last_name.toLowerCase().includes(term)
      );
    }

    // Team filter
    if (teamFilter !== 'all') {
      result = result.filter(w => w.team_id === teamFilter);
    }

    // Attendance filter
    if (attendanceFilter !== 'all') {
      if (attendanceFilter === 'confirmed') {
        result = result.filter(w => ['attending', 'arriving_late', 'leaving_early'].includes(w.attendance_status));
      } else if (attendanceFilter === 'unconfirmed') {
        result = result.filter(w => ['unconfirmed', 'pending'].includes(w.attendance_status));
      } else if (attendanceFilter === 'flagged') {
        result = result.filter(w => w.is_flagged || w.discussion_flag);
      }
    }

    // Sorting
    result.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case 'last_name': aVal = a.last_name; bVal = b.last_name; break;
        case 'first_name': aVal = a.first_name; bVal = b.first_name; break;
        case 'age': aVal = getAge(a.date_of_birth); bVal = getAge(b.date_of_birth); break;
        case 'weight': aVal = a.weight; bVal = b.weight; break;
        case 'experience': aVal = a.experience; bVal = b.experience; break;
        case 'skill': aVal = a.skill; bVal = b.skill; break;
        case 'match_count': aVal = a.match_count; bVal = b.match_count; break;
        case 'team': aVal = a.team_abbreviation; bVal = b.team_abbreviation; break;
        case 'attendance': aVal = a.attendance_status; bVal = b.attendance_status; break;
        case 'flagged': aVal = a.is_flagged ? 1 : 0; bVal = b.is_flagged ? 1 : 0; break;
        default: aVal = a.last_name; bVal = b.last_name;
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [wrestlers, searchTerm, teamFilter, attendanceFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  // Helper to calculate match quality based on attribute differences
  // Uses same weighted formula as EditMatchSheet: weightDiff*2 + ageDiff*3 + expDiff*5 + skillDiff*5
  const getMatchQuality = (wrestlerA: Wrestler | null, wrestlerB: Wrestler | null): { label: string; variant: 'default' | 'secondary' | 'outline'; className: string } => {
    if (!wrestlerA || !wrestlerB) {
      return { label: 'Unknown', variant: 'outline', className: 'text-muted-foreground' };
    }
    
    const ageA = getAge(wrestlerA.date_of_birth);
    const ageB = getAge(wrestlerB.date_of_birth);
    const ageDiff = Math.abs(ageA - ageB);
    const weightDiff = Math.abs(wrestlerA.weight - wrestlerB.weight);
    const expDiff = Math.abs(wrestlerA.experience - wrestlerB.experience);
    const skillDiff = Math.abs(wrestlerA.skill - wrestlerB.skill);
    
    // Weighted score: lower is better (same formula as EditMatchSheet)
    const score = weightDiff * 2 + ageDiff * 3 + expDiff * 5 + skillDiff * 5;
    
    if (score < 15) {
      return { label: 'Great Match', variant: 'default', className: 'bg-green-500/20 text-green-400 border-green-500/30' };
    } else if (score < 30) {
      return { label: 'Good Match', variant: 'secondary', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    } else {
      return { label: 'Fair Match', variant: 'outline', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    }
  };

  // Stats
  const stats = useMemo(() => {
    const totalMatches = matches.length;
    const matchesByMat: Record<number, number> = {};
    matches.forEach(m => {
      const mat = m.mat_number || 0;
      matchesByMat[mat] = (matchesByMat[mat] || 0) + 1;
    });
    const unconfirmedCount = teams.reduce((sum, t) => sum + t.unconfirmed_count, 0);
    const autoFlaggedCount = wrestlers.filter(w => w.is_flagged).length;
    const discussionFlaggedCount = wrestlers.filter(w => w.discussion_flag).length;
    // Count confirmed wrestlers with 0 matches — used to show "Add new wrestlers" button
    const unmatchedAttendingCount = wrestlers.filter(
      w => ['attending', 'arriving_late', 'leaving_early'].includes(w.attendance_status) && w.match_count === 0
    ).length;
    return { totalMatches, matchesByMat, unconfirmedCount, autoFlaggedCount, discussionFlaggedCount, unmatchedAttendingCount };
  }, [matches, teams, wrestlers]);

  // Get matches for selected wrestler
  const selectedWrestlerMatches = useMemo(() => {
    if (!selectedWrestlerId) return [];
    return matches
      .filter(m => m.wrestler_a_id === selectedWrestlerId || m.wrestler_b_id === selectedWrestlerId)
      .sort((a, b) => {
        // Sort by last 2 digits (time slot) since mats run simultaneously
        const slotA = (a.match_order ?? 0) % 100;
        const slotB = (b.match_order ?? 0) % 100;
        return slotA - slotB;
      });
  }, [selectedWrestlerId, matches]);

  // Get only mats that have matches assigned
  const matsWithMatches = useMemo(() => {
    return Array.from(
      new Set(matches.filter(m => m.mat_number).map(m => m.mat_number!))
    ).sort((a, b) => a - b);
  }, [matches]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!meet) return null;

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        {/* Header */}
        <div className="space-y-3 md:space-y-4">
          {/* Title row */}
          <div className="flex items-start gap-3 md:gap-4">
            <Button variant="ghost" size="icon" className="flex-shrink-0 mt-1" onClick={() => navigate('/meets')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-3xl font-bold truncate">{meet.name}</h1>
              </div>
              <p className="text-sm md:text-base text-muted-foreground">
                {format(parseISO(meet.meet_date), isMobile ? 'EEE, MMM d' : 'EEEE, MMMM d, yyyy')}
                {meet.meet_time && ` at ${format(new Date(`2000-01-01T${meet.meet_time}`), 'h:mm a')}`}
              </p>
            </div>
          </div>

          {/* Pairing Status Bar */}
          {matches.length > 0 && (
            <PairingStatusBar
              meetId={meet.id}
              status={meet.pairing_status}
              isHost={currentTeam?.id === meet.host_team_id}
              matchCount={matches.length}
              pendingApprovals={pendingApprovals}
              publicToken={publicToken}
              onStatusChange={fetchData}
              onViewAudit={() => setAuditSheetOpen(true)}
              onViewApprovals={() => setApprovalQueueOpen(true)}
              onViewSummary={() => setSummarySheetOpen(true)}
            />
          )}

          {/* Actions row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Primary action: Generate (host only) */}
              {currentTeam?.id === meet.host_team_id && matches.length === 0 && (
                <Button onClick={generatePairings} disabled={generating} size={isMobile ? 'sm' : 'default'}>
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {!isMobile && 'Generating...'}
                    </>
                  ) : (
                    <>
                      <Shuffle className="w-4 h-4 mr-2" />
                      {isMobile ? 'Generate' : 'Generate Pairings'}
                    </>
                  )}
                </Button>
              )}

              {/* Regenerate (host only, when matches already exist — with destructive confirmation) */}
              {currentTeam?.id === meet.host_team_id && matches.length > 0 && !isMobile && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={generating} size="default">
                      {generating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Shuffle className="w-4 h-4 mr-2" />
                          Regenerate
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Regenerate all pairings?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete all {matches.length} existing matches and generate new pairings from scratch.
                        This cannot be undone. Use "Add new wrestlers" instead if you only want to fill in unmatched wrestlers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={generatePairings} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Yes, regenerate all
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {/* Add new wrestlers (incremental) — visible when matches exist AND unmatched wrestlers present */}
              {currentTeam?.id === meet.host_team_id && matches.length > 0 && stats.unmatchedAttendingCount > 0 && (
                <Button
                  variant="outline"
                  onClick={generateIncrementalPairings}
                  disabled={generatingIncremental}
                  size={isMobile ? 'sm' : 'default'}
                >
                  {generatingIncremental ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {!isMobile && 'Matching...'}
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      {isMobile ? 'Add wrestlers' : `Add new wrestlers (${stats.unmatchedAttendingCount})`}
                    </>
                  )}
                </Button>
              )}

              {/* Print - prominent on mobile for viewing schedules */}
              {matches.length > 0 && (
                <Button 
                  variant={isMobile ? 'default' : 'outline'} 
                  size={isMobile ? 'sm' : 'default'}
                  onClick={() => setPrintScheduleOpen(true)}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  {isMobile ? 'Schedules' : 'Print'}
                </Button>
              )}

              {/* Desktop: show action buttons */}
              {!isMobile && currentTeam?.id === meet.host_team_id && (
                <>
                  <Button variant="outline" onClick={() => setExportImportOpen(true)}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export/Import
                  </Button>
                  <Button variant="outline" onClick={() => setRulesSheetOpen(true)}>
                    <Settings2 className="w-4 h-4 mr-2" />
                    Rules
                  </Button>
                </>
              )}

              {/* Mobile: More menu for host actions */}
              {isMobile && currentTeam?.id === meet.host_team_id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-popover">
                    <DropdownMenuItem onClick={() => setExportImportOpen(true)}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Export/Import
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRulesSheetOpen(true)}>
                      <Settings2 className="w-4 h-4 mr-2" />
                      Rules
                    </DropdownMenuItem>
                    {matches.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={resetPairings}
                          disabled={resetting}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Reset Pairings
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              {/* Refresh */}
              <Button variant="ghost" size="icon" onClick={fetchData}>
                <RefreshCw className="w-4 h-4" />
              </Button>

              {/* Reset (desktop only, host only, when matches exist) */}
              {!isMobile && currentTeam?.id === meet.host_team_id && matches.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={resetting}>
                      {resetting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset all pairings?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all {matches.length} matches for this meet. 
                        You will need to regenerate pairings after this action. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={resetPairings} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Yes, reset all pairings
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>

        {/* Warning for unconfirmed */}
        {stats.unconfirmedCount > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {stats.unconfirmedCount} wrestler{stats.unconfirmedCount !== 1 ? 's' : ''} have unconfirmed attendance.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <Card>
            <CardContent className="p-3 md:pt-6 md:p-6">
              <div className="text-lg md:text-2xl font-bold">{stats.totalMatches}</div>
              <p className="text-xs md:text-sm text-muted-foreground">Matches</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:pt-6 md:p-6">
              <div className={`text-lg md:text-2xl font-bold ${stats.autoFlaggedCount > 0 ? 'text-warning' : ''}`}>
                {stats.autoFlaggedCount}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">Flagged</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:pt-6 md:p-6">
              <div className={`text-lg md:text-2xl font-bold ${stats.discussionFlaggedCount > 0 ? 'text-primary' : ''}`}>
                {stats.discussionFlaggedCount}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">Discuss</p>
            </CardContent>
          </Card>
        </div>

        {/* Matches by Mat */}
        {Object.keys(stats.matchesByMat).length > 0 && (
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {Object.entries(stats.matchesByMat)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([mat, count]) => (
                <Badge key={mat} variant="outline" className="text-xs md:text-sm">
                  Mat {mat === '0' ? '?' : mat}: {count}
                </Badge>
              ))}
          </div>
        )}

        {/* Teams Overview - scrollable on mobile */}
        <div className="flex flex-nowrap md:flex-wrap gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          {teams.map(team => (
            <div
              key={team.team_id}
              className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg border flex-shrink-0"
            >
              <Badge
                className="text-xs"
                style={{
                  backgroundColor: team.primary_color || 'hsl(var(--muted))',
                  color: getContrastColor(team.primary_color),
                }}
              >
                {team.abbreviation}
                {team.is_host && ' ★'}
              </Badge>
              <span className="text-xs md:text-sm whitespace-nowrap">
                {team.attending_count}
                {!isMobile && ' attending'}
                {team.unconfirmed_count > 0 && (
                  <span className="text-warning ml-1">
                    (+{team.unconfirmed_count})
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs 
          defaultValue={isMobile ? 'mats' : 'wrestlers'} 
          className="space-y-4"
          onValueChange={(value) => {
            // Clear wrestler selection when switching tabs to prevent cross-tab filtering confusion
            if (value !== 'wrestlers') {
              setSelectedWrestlerId(null);
            }
          }}
        >
          <TabsList className="sticky top-0 z-10 bg-background w-full justify-start overflow-x-auto">
            {!isMobile && (
              <TabsTrigger value="wrestlers">
                <Users className="w-4 h-4 mr-2" />
                View by Wrestler
              </TabsTrigger>
            )}
            <TabsTrigger value="mats" className="flex-shrink-0">
              {isMobile ? 'Matches' : 'View by Mat'}
            </TabsTrigger>
            {!isMobile && (
              <TabsTrigger value="columns" className="flex-shrink-0">
                <LayoutGrid className="w-4 h-4 mr-2" />
                Mat Columns
              </TabsTrigger>
            )}
          </TabsList>

          {/* Wrestlers tab - desktop only due to table complexity */}
          {!isMobile && (
            <TabsContent value="wrestlers" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search wrestlers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map(t => (
                    <SelectItem key={t.team_id} value={t.team_id}>{t.team_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Attendance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Wrestlers Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('last_name')}>
                        <div className="flex items-center gap-1">Last Name <SortIcon field="last_name" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('first_name')}>
                        <div className="flex items-center gap-1">First Name <SortIcon field="first_name" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('age')}>
                        <div className="flex items-center gap-1">Age <SortIcon field="age" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('weight')}>
                        <div className="flex items-center gap-1">Weight <SortIcon field="weight" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('experience')}>
                        <div className="flex items-center gap-1">Exp <SortIcon field="experience" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('skill')}>
                        <div className="flex items-center gap-1">Skill <SortIcon field="skill" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('team')}>
                        <div className="flex items-center gap-1">Team <SortIcon field="team" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('match_count')}>
                        <div className="flex items-center gap-1">Matches <SortIcon field="match_count" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('attendance')}>
                        <div className="flex items-center gap-1">Status <SortIcon field="attendance" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('flagged')}>
                        <div className="flex items-center gap-1">Flag <SortIcon field="flagged" /></div>
                      </TableHead>
                      <TableHead>Discuss</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWrestlers.map(wrestler => (
                      <>
                        <TableRow
                          key={wrestler.id}
                          className={`cursor-pointer ${wrestler.flag_severity === 'critical' ? 'bg-destructive/5' : wrestler.is_flagged || wrestler.discussion_flag ? 'bg-yellow-500/5' : ''} ${selectedWrestlerId === wrestler.id ? 'bg-muted' : ''}`}
                          onClick={() => setSelectedWrestlerId(prev => prev === wrestler.id ? null : wrestler.id)}
                        >
                          <TableCell className="font-medium">{wrestler.last_name}</TableCell>
                          <TableCell>{wrestler.first_name}</TableCell>
                          <TableCell>{getAge(wrestler.date_of_birth)}</TableCell>
                          <TableCell>{wrestler.weight} lbs</TableCell>
                          <TableCell>{wrestler.experience}</TableCell>
                          <TableCell>{wrestler.skill}</TableCell>
                          <TableCell>
                            <Badge
                              style={{
                                backgroundColor: wrestler.team_color || 'hsl(var(--muted))',
                                color: getContrastColor(wrestler.team_color),
                              }}
                            >
                              {wrestler.team_abbreviation}
                            </Badge>
                          </TableCell>
                          <TableCell>{wrestler.match_count}</TableCell>
                          <TableCell>{getAttendanceBadge(wrestler.attendance_status)}</TableCell>
                          <TableCell>
                            {wrestler.is_flagged && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex">
                                    <Flag className={`w-4 h-4 ${wrestler.flag_severity === 'critical' ? 'text-destructive' : 'text-yellow-500'}`} />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>{wrestler.flag_reason}</TooltipContent>
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {wrestler.discussion_flag ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setFlagDialogWrestler(wrestler)}
                                  >
                                    <MessageSquare className="w-4 h-4 text-orange-500 fill-orange-500/20" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {wrestler.discussion_flag.note || 'Flagged for discussion'}
                                </TooltipContent>
                              </Tooltip>
                            ) : wrestler.team_id === currentTeam?.id ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-50 hover:opacity-100"
                                onClick={() => setFlagDialogWrestler(wrestler)}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                        {selectedWrestlerId === wrestler.id && (
                          <TableRow>
                            <TableCell colSpan={11} className="bg-muted/50 p-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">Matches for {wrestler.first_name} {wrestler.last_name}</h4>
                                  {currentTeam?.id === meet?.host_team_id && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAddMatchWrestler(wrestler);
                                      }}
                                    >
                                      <UserPlus className="w-4 h-4 mr-1" />
                                      Add Match
                                    </Button>
                                  )}
                                </div>
                                {selectedWrestlerMatches.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">No matches assigned</p>
                                ) : (
                                  <div className="space-y-1">
                                    {selectedWrestlerMatches.map((match) => {
                                      const opponent = match.wrestler_a_id === wrestler.id
                                        ? match.wrestler_b
                                        : match.wrestler_a;
                                      const matMatchIndex = match.mat_number 
                                        ? matches.filter(m => m.mat_number === match.mat_number).findIndex(m => m.id === match.id)
                                        : -1;
                                      const matchNumber = match.mat_number 
                                        ? (match.mat_number * 100) + matMatchIndex 
                                        : null;
                                      return (
                                        <div key={match.id} className={`flex items-center gap-4 text-sm p-2 rounded ${match.scratched_wrestler_id ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-background'}`}>
                                          <span className="font-mono text-muted-foreground w-10">
                                            {matchNumber !== null ? `#${matchNumber}` : '—'}
                                          </span>
                                          <div className="flex-1">
                                            <span className="font-medium">
                                              vs {opponent?.first_name} {opponent?.last_name}
                                            </span>
                                            <Badge
                                              className="ml-2"
                                              style={{
                                                backgroundColor: opponent?.team_color || 'hsl(var(--muted))',
                                                color: opponent?.team_color ? (
                                                  (() => {
                                                    const hex = opponent.team_color.replace('#', '');
                                                    const r = parseInt(hex.substr(0, 2), 16);
                                                    const g = parseInt(hex.substr(2, 2), 16);
                                                    const b = parseInt(hex.substr(4, 2), 16);
                                                    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                                                    return luminance > 0.5 ? '#000000' : '#ffffff';
                                                  })()
                                                ) : 'hsl(var(--foreground))',
                                              }}
                                            >
                                              {opponent?.team_abbreviation}
                                            </Badge>
                                          </div>
                                          <Badge className={getMatchQuality(match.wrestler_a, match.wrestler_b).className}>
                                            {getMatchQuality(match.wrestler_a, match.wrestler_b).label}
                                          </Badge>
                                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span>Age: {opponent ? getAge(opponent.date_of_birth) : '—'}</span>
                                            <span>{opponent?.weight || '—'} lbs</span>
                                            <span>Exp: {opponent?.experience ?? '—'}</span>
                                            <span>Skill: {opponent?.skill ?? '—'}</span>
                                          </div>
                                          {match.scratched_wrestler_id && (
                                            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                              Replaced
                                            </Badge>
                                          )}
                                          {currentTeam?.id === meet?.host_team_id && !match.scratched_wrestler_id && (
                                            <div className="flex items-center gap-0.5">
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-muted-foreground hover:text-primary"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setEditMode('change');
                                                      setScratchMatch(match);
                                                      setScratchWrestlerId(wrestler.id);
                                                    }}
                                                  >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Change wrestler</TooltipContent>
                                              </Tooltip>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-muted-foreground hover:text-orange-500"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setEditMode('scratch');
                                                      setScratchMatch(match);
                                                      setScratchWrestlerId(wrestler.id);
                                                    }}
                                                  >
                                                    <UserX className="w-3.5 h-3.5" />
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Mark as scratch</TooltipContent>
                                              </Tooltip>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          )}

          <TabsContent value="mats" className="space-y-4">
            {matsWithMatches.length === 0 ? (
              <Alert>
                <AlertDescription>No matches have been assigned to mats yet. {matches.length === 0 && 'Generate pairings to create matches.'}</AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Filters row */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Mat filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs md:text-sm text-muted-foreground">Mat:</span>
                    <Select value={matFilter} onValueChange={setMatFilter}>
                      <SelectTrigger className="w-[100px] md:w-[150px] h-9">
                        <SelectValue placeholder="All Mats" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Mats</SelectItem>
                        {matsWithMatches.map(matNum => (
                          <SelectItem key={matNum} value={matNum.toString()}>
                            Mat {matNum}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Wrestler filter - for isolating specific wrestler's schedule */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs md:text-sm text-muted-foreground">Wrestler:</span>
                    <Select value={selectedWrestlerId || 'all'} onValueChange={(v) => setSelectedWrestlerId(v === 'all' ? null : v)}>
                      <SelectTrigger className={`h-9 ${isMobile ? 'w-[140px]' : 'w-[200px]'}`}>
                        <SelectValue placeholder="All Wrestlers" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="all">All Wrestlers</SelectItem>
                        {wrestlers
                          .filter(w => w.match_count > 0)
                          .sort((a, b) => a.last_name.localeCompare(b.last_name))
                          .map(w => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.last_name}, {w.first_name} ({w.team_abbreviation})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className={`grid gap-3 md:gap-4 ${matFilter === 'all' && !isMobile ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                  {matsWithMatches
                    .filter(matNumber => matFilter === 'all' || matNumber.toString() === matFilter)
                    .map(matNumber => {
                      const matMatches = matches
                        .filter(m => m.mat_number === matNumber)
                        .filter(m => !selectedWrestlerId || m.wrestler_a_id === selectedWrestlerId || m.wrestler_b_id === selectedWrestlerId);
                      return (
                        <Card key={matNumber}>
                          <CardHeader className="p-3 md:p-6 pb-2 md:pb-2">
                            <CardTitle className="text-base md:text-lg flex items-center justify-between">
                              Mat {matNumber}
                              <Badge variant="outline" className="text-xs">{matMatches.length}</Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                            {matMatches.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-4 text-center">
                                No matches assigned
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {matMatches.map((match, idx) => {
                                  const matchNumber = (matNumber * 100) + idx;
                                  const wrestlerA = match.wrestler_a;
                                  const wrestlerB = match.wrestler_b;
                                  return (
                                    <div
                                      key={match.id}
                                      className={`p-2 md:p-3 rounded text-sm space-y-1.5 md:space-y-2 ${match.scratched_wrestler_id ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-muted/30'}`}
                                    >
                                      {/* Header row - match number and quality */}
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-mono text-xs md:text-sm text-muted-foreground">#{matchNumber}</span>
                                        <div className="flex items-center gap-1 md:gap-2">
                                          {newMatchIds.has(match.id) && (
                                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                              New
                                            </Badge>
                                          )}
                                          <Badge className={`text-xs ${getMatchQuality(wrestlerA, wrestlerB).className}`}>
                                            {isMobile ? getMatchQuality(wrestlerA, wrestlerB).label.split(' ')[0] : getMatchQuality(wrestlerA, wrestlerB).label}
                                          </Badge>
                                          {match.scratched_wrestler_id && (
                                            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                                              Replaced
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* Mobile: stacked layout */}
                                      {isMobile ? (
                                        <div className="space-y-1.5">
                                          {/* Wrestler A */}
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm truncate">
                                              {wrestlerA?.first_name} {wrestlerA?.last_name}
                                            </span>
                                            <Badge
                                              className="text-xs ml-2 flex-shrink-0"
                                              style={{
                                                backgroundColor: wrestlerA?.team_color || 'hsl(var(--muted))',
                                                color: getContrastColor(wrestlerA?.team_color || null),
                                              }}
                                            >
                                              {wrestlerA?.team_abbreviation}
                                            </Badge>
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            Age {wrestlerA ? getAge(wrestlerA.date_of_birth) : '—'} • {wrestlerA?.weight || '—'}lbs • Exp {wrestlerA?.experience ?? '—'} • Skill {wrestlerA?.skill ?? '—'}
                                          </div>
                                          
                                          <div className="text-center text-xs text-muted-foreground py-0.5">vs</div>
                                          
                                          {/* Wrestler B */}
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm truncate">
                                              {wrestlerB?.first_name} {wrestlerB?.last_name}
                                            </span>
                                            <Badge
                                              className="text-xs ml-2 flex-shrink-0"
                                              style={{
                                                backgroundColor: wrestlerB?.team_color || 'hsl(var(--muted))',
                                                color: getContrastColor(wrestlerB?.team_color || null),
                                              }}
                                            >
                                              {wrestlerB?.team_abbreviation}
                                            </Badge>
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            Age {wrestlerB ? getAge(wrestlerB.date_of_birth) : '—'} • {wrestlerB?.weight || '—'}lbs • Exp {wrestlerB?.experience ?? '—'} • Skill {wrestlerB?.skill ?? '—'}
                                          </div>
                                        </div>
                                      ) : (
                                        /* Desktop: side-by-side layout */
                                        <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                                          <div className="space-y-1">
                                            <div className="font-medium">
                                              {wrestlerA?.first_name} {wrestlerA?.last_name}
                                              <span className="text-muted-foreground ml-1">({wrestlerA?.team_abbreviation})</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                                              <span>Age: {wrestlerA ? getAge(wrestlerA.date_of_birth) : '—'}</span>
                                              <span>{wrestlerA?.weight || '—'} lbs</span>
                                              <span>Exp: {wrestlerA?.experience ?? '—'}</span>
                                              <span>Skill: {wrestlerA?.skill ?? '—'}</span>
                                            </div>
                                          </div>
                                          <span className="text-muted-foreground font-medium px-2">vs</span>
                                          <div className="space-y-1 text-right">
                                            <div className="font-medium">
                                              {wrestlerB?.first_name} {wrestlerB?.last_name}
                                              <span className="text-muted-foreground ml-1">({wrestlerB?.team_abbreviation})</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground flex flex-wrap gap-2 justify-end">
                                              <span>Age: {wrestlerB ? getAge(wrestlerB.date_of_birth) : '—'}</span>
                                              <span>{wrestlerB?.weight || '—'} lbs</span>
                                              <span>Exp: {wrestlerB?.experience ?? '—'}</span>
                                              <span>Skill: {wrestlerB?.skill ?? '—'}</span>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>

                {/* Unassigned matches */}
                {(() => {
                  const unassigned = matches.filter(m => !m.mat_number);
                  if (unassigned.length === 0) return null;
                  return (
                    <Card className="lg:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center justify-between text-yellow-500">
                          Unassigned Matches
                          <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                            {unassigned.length} matches
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {unassigned.map((match, idx) => {
                            const wrestlerA = match.wrestler_a;
                            const wrestlerB = match.wrestler_b;
                            return (
                              <div
                                key={match.id}
                                className="p-3 rounded bg-yellow-500/10 text-sm space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-muted-foreground">Unassigned #{idx + 1}</span>
                                </div>
                                <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                                  <div className="space-y-1">
                                    <div className="font-medium">
                                      {wrestlerA?.first_name} {wrestlerA?.last_name}
                                      <span className="text-muted-foreground ml-1">({wrestlerA?.team_abbreviation})</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                                      <span>Age: {wrestlerA ? getAge(wrestlerA.date_of_birth) : '—'}</span>
                                      <span>{wrestlerA?.weight || '—'} lbs</span>
                                      <span>Exp: {wrestlerA?.experience ?? '—'}</span>
                                      <span>Skill: {wrestlerA?.skill ?? '—'}</span>
                                    </div>
                                  </div>
                                  <span className="text-muted-foreground font-medium px-2">vs</span>
                                  <div className="space-y-1 text-right">
                                    <div className="font-medium">
                                      {wrestlerB?.first_name} {wrestlerB?.last_name}
                                      <span className="text-muted-foreground ml-1">({wrestlerB?.team_abbreviation})</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground flex flex-wrap gap-2 justify-end">
                                      <span>Age: {wrestlerB ? getAge(wrestlerB.date_of_birth) : '—'}</span>
                                      <span>{wrestlerB?.weight || '—'} lbs</span>
                                      <span>Exp: {wrestlerB?.experience ?? '—'}</span>
                                      <span>Skill: {wrestlerB?.skill ?? '—'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
              </>
            )}
          </TabsContent>

          {/* Mat Columns View with Drag and Drop */}
          <TabsContent value="columns" className="space-y-4">
            {matsWithMatches.length === 0 ? (
              <Alert>
                <AlertDescription>No matches have been assigned to mats yet.</AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMatColumnsFullScreen(true)}
                  >
                    <Maximize2 className="w-4 h-4 mr-2" />
                    Full Screen
                  </Button>
                </div>
                <MatColumnsView
                  matches={matches}
                  matsWithMatches={matsWithMatches}
                  isHost={currentTeam?.id === meet.host_team_id}
                  onMatchesReorder={handleMatchesReorder}
                  getContrastColor={getContrastColor}
                  conflictMinGap={conflictMinGap}
                />
              </>
            )}
          </TabsContent>

          {/* Full Screen Mat Columns Dialog */}
          <Dialog open={matColumnsFullScreen} onOpenChange={setMatColumnsFullScreen}>
            <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="flex items-center justify-between pr-8">
                  <span>Mat Columns - {meet?.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMatColumnsFullScreen(false)}
                  >
                    <Minimize2 className="w-4 h-4 mr-2" />
                    Exit Full Screen
                  </Button>
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-auto">
                <MatColumnsView
                  matches={matches}
                  matsWithMatches={matsWithMatches}
                  isHost={currentTeam?.id === meet.host_team_id}
                  onMatchesReorder={handleMatchesReorder}
                  getContrastColor={getContrastColor}
                  conflictMinGap={conflictMinGap}
                />
              </div>
            </DialogContent>
          </Dialog>
        </Tabs>
      </div>

      {/* Generation Report Sheet */}
      {generationReportData && (
        <GenerationReportSheet
          open={generationReportOpen}
          onOpenChange={setGenerationReportOpen}
          matchesCreated={generationReportData.matchesCreated}
          wrestlersWithZeroMatches={generationReportData.wrestlersWithZeroMatches}
        />
      )}

      {/* Discussion Flag Dialog */}
      {flagDialogWrestler && currentTeam && meet && (
        <WrestlerFlagDialog
          open={!!flagDialogWrestler}
          onOpenChange={(open) => !open && setFlagDialogWrestler(null)}
          meetId={meet.id}
          wrestlerId={flagDialogWrestler.id}
          wrestlerName={`${flagDialogWrestler.first_name} ${flagDialogWrestler.last_name}`}
          teamId={flagDialogWrestler.team_id}
          currentTeamId={currentTeam.id}
          existingFlag={flagDialogWrestler.discussion_flag}
          onSuccess={fetchData}
        />
      )}

      {/* Edit Match Sheet */}
      {meet && meetId && (
        <EditMatchSheet
          open={!!scratchMatch && !!scratchWrestlerId}
          onOpenChange={(open) => {
            if (!open) {
              setScratchMatch(null);
              setScratchWrestlerId(null);
            }
          }}
          match={scratchMatch}
          selectedWrestlerId={scratchWrestlerId}
          allWrestlers={wrestlers}
          allMatches={matches}
          teams={teams}
          meetId={meetId}
          pairingStatus={meet.pairing_status}
          userId={user?.id || null}
          hostTeamId={meet.host_team_id}
          onSuccess={fetchData}
          mode={editMode}
        />
      )}

      {/* Meet Rules Sheet */}
      {meet && (
        <MeetRulesSheet
          open={rulesSheetOpen}
          onOpenChange={setRulesSheetOpen}
          meetId={meet.id}
          hostTeamId={meet.host_team_id}
        />
      )}

      {/* Print Schedule Dialog */}
      {meet && (
        <PrintScheduleDialog
          open={printScheduleOpen}
          onOpenChange={setPrintScheduleOpen}
          meetName={meet.name}
          meetDate={format(parseISO(meet.meet_date), 'MMMM d, yyyy')}
          teams={teams}
          wrestlers={wrestlers}
          matches={matches}
        />
      )}

      {/* Export/Import Dialog */}
      {meet && (
        <ExportImportDialog
          open={exportImportOpen}
          onOpenChange={setExportImportOpen}
          meetId={meet.id}
          meetName={meet.name}
          wrestlers={wrestlers}
          matches={matches}
          teams={teams}
          onPairingsImported={fetchData}
        />
      )}

      {/* Add Match Sheet */}
      {meet && meetId && (
        <AddMatchSheet
          open={!!addMatchWrestler}
          onOpenChange={(open) => {
            if (!open) setAddMatchWrestler(null);
          }}
          wrestler={addMatchWrestler}
          allWrestlers={wrestlers}
          allMatches={matches}
          teams={teams}
          meetId={meetId}
          matRules={matRules}
          pairingStatus={meet.pairing_status}
          userId={user?.id || null}
          hostTeamId={meet.host_team_id}
          onSuccess={fetchData}
        />
      )}

      {/* Audit Trail Sheet */}
      <AuditTrailSheet
        meetId={meet?.id || ''}
        teams={teams}
        isHost={currentTeam?.id === meet?.host_team_id}
        currentTeamId={currentTeam?.id || ''}
        open={auditSheetOpen}
        onOpenChange={setAuditSheetOpen}
      />

      {/* Changes Summary Sheet */}
      <ChangesSummarySheet
        meetId={meet?.id || ''}
        open={summarySheetOpen}
        onOpenChange={setSummarySheetOpen}
      />

      {/* Approval Queue Sheet (host only) */}
      {meet && currentTeam?.id === meet.host_team_id && (
        <ApprovalQueueSheet
          meetId={meet.id}
          open={approvalQueueOpen}
          onOpenChange={setApprovalQueueOpen}
          onApprovalComplete={fetchData}
        />
      )}

      {/* Scratch Wrestler Dialog */}
      {wrestlerToScratch && meet && (
        <ScratchWrestlerDialog
          meetId={meet.id}
          wrestler={wrestlerToScratch}
          matches={matches}
          allWrestlers={wrestlers}
          open={scratchWrestlerDialogOpen}
          onOpenChange={(open) => {
            setScratchWrestlerDialogOpen(open);
            if (!open) setWrestlerToScratch(null);
          }}
          onComplete={fetchData}
        />
      )}
    </DashboardLayout>
  );
}