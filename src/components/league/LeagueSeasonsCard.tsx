import { useState } from 'react';
import { CalendarDays, Plus, Check, Trash2, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CreateSeasonModal } from '@/components/roster/CreateSeasonModal';
import { useLeagueSeasons, Season } from '@/hooks/useLeagueSeasons';
import { useToast } from '@/hooks/use-toast';

interface LeagueSeasonsCardProps {
  leagueId: string;
}

export function LeagueSeasonsCard({ leagueId }: LeagueSeasonsCardProps) {
  const { toast } = useToast();
  const { seasons, currentSeason, loading, createSeason, setCurrentSeason, deleteSeason } = useLeagueSeasons(leagueId);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [seasonToDelete, setSeasonToDelete] = useState<Season | null>(null);

  const formatSeasonDates = (season: Season) => {
    const start = new Date(season.start_date);
    const end = new Date(season.end_date);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const handleSetCurrent = async (seasonId: string) => {
    const success = await setCurrentSeason(seasonId);
    if (success) {
      toast({
        title: 'Season updated',
        description: 'Current season has been changed.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update current season.',
      });
    }
  };

  const handleDelete = async () => {
    if (!seasonToDelete) return;
    
    const success = await deleteSeason(seasonToDelete.id);
    setSeasonToDelete(null);
    
    if (success) {
      toast({
        title: 'Season deleted',
        description: `${seasonToDelete.name} has been removed.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete season. Make sure no wrestlers or meets are associated with it.',
      });
    }
  };

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Seasons
              </CardTitle>
              <CardDescription>
                Manage league seasons for roster organization
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateModal(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Season
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Loading...</div>
          ) : seasons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No seasons created yet</p>
              <p className="text-sm mt-1">Create your first season to help teams organize their rosters.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {seasons.map((season) => (
                <div
                  key={season.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{season.name}</span>
                        {season.is_current && (
                          <Badge variant="default" className="text-xs">
                            <Check className="w-3 h-3 mr-1" />
                            Current
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatSeasonDates(season)}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!season.is_current && (
                        <DropdownMenuItem onClick={() => handleSetCurrent(season.id)}>
                          <Check className="w-4 h-4 mr-2" />
                          Set as Current
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => setSeasonToDelete(season)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateSeasonModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={createSeason}
      />

      <AlertDialog open={!!seasonToDelete} onOpenChange={() => setSeasonToDelete(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Season?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the season "{seasonToDelete?.name}". Wrestlers enrolled in this season will be unenrolled. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Season
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
