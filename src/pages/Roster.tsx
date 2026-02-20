import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTeam } from '@/contexts/TeamContext';
import { useUserContext } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Upload, MoreHorizontal, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Archive, CalendarDays, AlertCircle } from 'lucide-react';
import { AddWrestlerModal } from '@/components/roster/AddWrestlerModal';
import { BulkPasteModal } from '@/components/roster/BulkPasteModal';
import { EditWrestlerModal } from '@/components/roster/EditWrestlerModal';
import { SeasonSelector } from '@/components/roster/SeasonSelector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { useSeasons } from '@/hooks/useSeasons';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Wrestler {
  id: string;
  team_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  weight: number;
  experience: number;
  skill: number;
  status: string;
  last_weigh_in_date?: string | null;
}

function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function Roster() {
  const { currentTeam, isOwner } = useTeam();
  const { currentContext } = useUserContext();
  const isLeagueContext = currentContext?.type === 'league';
  const { toast } = useToast();
  const [wrestlers, setWrestlers] = useState<Wrestler[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingWrestler, setEditingWrestler] = useState<Wrestler | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('last_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showArchived, setShowArchived] = useState(false);
  
  // Seasons hook
  const { 
    seasons, 
    currentSeason, 
    loading: seasonsLoading,
    createSeason,
    setCurrentSeason,
    getWrestlerSeasonStatus,
    wrestlerSeasons,
    addWrestlerToSeason,
    refetch: refetchSeasons,
    canCreateSeason,
    isLeagueManaged,
  } = useSeasons();

  const fetchWrestlers = async () => {
    if (!currentTeam) return;

    const { data, error } = await supabase
      .from('wrestlers')
      .select('*')
      .eq('team_id', currentTeam.id)
      .order('last_name', { ascending: true });

    if (error) {
      console.error('Error fetching wrestlers:', error);
    } else {
      setWrestlers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWrestlers();
  }, [currentTeam]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('wrestlers')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete wrestler.',
      });
    } else {
      toast({
        title: 'Wrestler removed',
        description: 'The wrestler has been removed from your roster.',
      });
      fetchWrestlers();
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1" /> 
      : <ArrowDown className="w-4 h-4 ml-1" />;
  };

  // Filter wrestlers based on season enrollment
  const seasonFilteredWrestlers = useMemo(() => {
    if (!currentSeason) {
      // No season set - show all wrestlers (legacy behavior)
      return wrestlers;
    }
    
    // Only show wrestlers enrolled in the current season
    const enrolledWrestlerIds = new Set(wrestlerSeasons.map(ws => ws.wrestler_id));
    return wrestlers.filter(w => enrolledWrestlerIds.has(w.id));
  }, [wrestlers, currentSeason, wrestlerSeasons]);

  // Count of wrestlers not in current season
  const notInSeasonCount = useMemo(() => {
    if (!currentSeason) return 0;
    const enrolledWrestlerIds = new Set(wrestlerSeasons.map(ws => ws.wrestler_id));
    return wrestlers.filter(w => !enrolledWrestlerIds.has(w.id)).length;
  }, [wrestlers, currentSeason, wrestlerSeasons]);

  const sortedAndFilteredWrestlers = useMemo(() => {
    const filtered = seasonFilteredWrestlers.filter((w) => {
      const fullName = `${w.first_name} ${w.last_name}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase());
      
      // Get season status for this wrestler
      const seasonStatus = getWrestlerSeasonStatus(w.id);
      const isArchivedInSeason = seasonStatus?.status === 'archived';
      const matchesStatus = showArchived ? true : !isArchivedInSeason && w.status !== 'archived';
      
      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortColumn) {
        case 'last_name':
          aVal = a.last_name.toLowerCase();
          bVal = b.last_name.toLowerCase();
          break;
        case 'age':
          aVal = calculateAge(a.date_of_birth);
          bVal = calculateAge(b.date_of_birth);
          break;
        case 'weight':
          aVal = a.weight;
          bVal = b.weight;
          break;
        case 'experience':
          aVal = a.experience;
          bVal = b.experience;
          break;
        case 'skill':
          aVal = a.skill;
          bVal = b.skill;
          break;
        case 'last_weigh_in':
          aVal = a.last_weigh_in_date || '';
          bVal = b.last_weigh_in_date || '';
          break;
        default:
          aVal = a.last_name.toLowerCase();
          bVal = b.last_name.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [seasonFilteredWrestlers, searchQuery, sortColumn, sortDirection, showArchived, getWrestlerSeasonStatus]);

  const archivedCount = useMemo(() => {
    if (!currentSeason) {
      return wrestlers.filter(w => w.status === 'archived').length;
    }
    // Count archived in current season
    return wrestlerSeasons.filter(ws => ws.status === 'archived').length;
  }, [wrestlers, currentSeason, wrestlerSeasons]);

  const formatWeighInDate = (date: string | null | undefined) => {
    if (!date) return '—';
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch {
      return '—';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Roster</h1>
              <SeasonSelector
                seasons={seasons}
                currentSeason={currentSeason}
                onSeasonChange={setCurrentSeason}
                onCreateSeason={createSeason}
                canManage={canCreateSeason}
                isLeagueContext={isLeagueContext}
              />
            </div>
            <p className="text-muted-foreground mt-1">
              Manage your wrestlers for {currentTeam?.name || 'your team'}
              {currentSeason && (
                <span className="text-primary"> • {currentSeason.name}</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowBulkModal(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Bulk Paste
            </Button>
            <Button className="btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Wrestler
            </Button>
          </div>
        </div>

        {/* No Season Warning */}
        {seasons.length === 0 && !seasonsLoading && (
          <Alert>
            <CalendarDays className="h-4 w-4" />
            <AlertDescription>
              {isLeagueManaged 
                ? 'No season has been created by the league yet. Contact your league organizer to set up the season.'
                : canCreateSeason 
                  ? 'No season has been created yet. Create a season to organize your roster by school year.'
                  : 'No season has been created yet. Contact the team owner to set up the season.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Past wrestlers not in season notice */}
        {currentSeason && notInSeasonCount > 0 && (
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {notInSeasonCount} wrestler{notInSeasonCount !== 1 ? 's' : ''} from previous seasons not shown. 
              Add returning wrestlers using "Bulk Paste" with fuzzy matching enabled.
            </AlertDescription>
          </Alert>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search wrestlers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {archivedCount > 0 && (
            <div className="flex items-center gap-2">
              <Switch
                id="show-archived"
                checked={showArchived}
                onCheckedChange={setShowArchived}
              />
              <Label htmlFor="show-archived" className="text-sm text-muted-foreground cursor-pointer">
                Show archived ({archivedCount})
              </Label>
            </div>
          )}
        </div>

        {/* Data Grid */}
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : sortedAndFilteredWrestlers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                {wrestlers.length === 0
                  ? 'No wrestlers on your roster yet.'
                  : 'No wrestlers match your search.'}
              </p>
              {wrestlers.length === 0 && (
                <Button className="btn-primary" onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Wrestler
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-grid">
                <thead>
                  <tr>
                    <th 
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort('last_name')}
                    >
                      <span className="flex items-center">
                        Name {getSortIcon('last_name')}
                      </span>
                    </th>
                    <th 
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort('age')}
                    >
                      <span className="flex items-center">
                        Age {getSortIcon('age')}
                      </span>
                    </th>
                    <th 
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort('weight')}
                    >
                      <span className="flex items-center">
                        Weight {getSortIcon('weight')}
                      </span>
                    </th>
                    <th 
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort('experience')}
                    >
                      <span className="flex items-center">
                        Exp {getSortIcon('experience')}
                      </span>
                    </th>
                    <th 
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort('skill')}
                    >
                      <span className="flex items-center">
                        Skill {getSortIcon('skill')}
                      </span>
                    </th>
                    <th 
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort('last_weigh_in')}
                    >
                      <span className="flex items-center">
                        Weigh-in {getSortIcon('last_weigh_in')}
                      </span>
                    </th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAndFilteredWrestlers.map((wrestler) => {
                    const age = calculateAge(wrestler.date_of_birth);
                    const isArchived = wrestler.status === 'archived';
                    return (
                      <tr key={wrestler.id} className={isArchived ? 'opacity-60' : ''}>
                        <td className="font-medium">
                          <div className="flex items-center gap-2">
                            {wrestler.first_name} {wrestler.last_name}
                            {isArchived && (
                              <Badge variant="secondary" className="text-xs">
                                <Archive className="w-3 h-3 mr-1" />
                                Archived
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td>{age}</td>
                        <td>{wrestler.weight} lbs</td>
                        <td>{wrestler.experience}</td>
                        <td>{wrestler.skill}</td>
                        <td className="text-muted-foreground">
                          {formatWeighInDate(wrestler.last_weigh_in_date)}
                        </td>
                        <td>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingWrestler(wrestler)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(wrestler.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AddWrestlerModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={() => {
          fetchWrestlers();
          refetchSeasons();
        }}
        currentSeasonId={currentSeason?.id}
        onAddToSeason={addWrestlerToSeason}
      />

      <BulkPasteModal
        open={showBulkModal}
        onOpenChange={setShowBulkModal}
        onSuccess={() => {
          fetchWrestlers();
          refetchSeasons();
        }}
        existingWrestlers={wrestlers}
        currentSeasonId={currentSeason?.id}
        onAddToSeason={addWrestlerToSeason}
      />

      {editingWrestler && (
        <EditWrestlerModal
          wrestler={editingWrestler}
          open={!!editingWrestler}
          onOpenChange={(open) => !open && setEditingWrestler(null)}
          onSuccess={fetchWrestlers}
        />
      )}
    </DashboardLayout>
  );
}
