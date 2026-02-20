import { useState } from 'react';
import { CalendarDays, ChevronDown, Plus, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Season } from '@/hooks/useSeasons';
import { CreateSeasonModal } from './CreateSeasonModal';

interface SeasonSelectorProps {
  seasons: Season[];
  currentSeason: Season | null;
  onSeasonChange: (seasonId: string) => void;
  onCreateSeason: (data: { name: string; start_date: string; end_date: string }) => Promise<Season | null>;
  canManage?: boolean;
  isLeagueContext?: boolean;
}

export function SeasonSelector({
  seasons,
  currentSeason,
  onSeasonChange,
  onCreateSeason,
  canManage = false,
  isLeagueContext = false,
}: SeasonSelectorProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const formatSeasonDates = (season: Season) => {
    const start = new Date(season.start_date);
    const end = new Date(season.end_date);
    return `${start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  };

  if (seasons.length === 0 && !canManage) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <CalendarDays className="w-3 h-3 mr-1" />
        No season set
      </Badge>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarDays className="w-4 h-4" />
            {currentSeason ? currentSeason.name : 'Select Season'}
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {seasons.map((season) => (
            <DropdownMenuItem
              key={season.id}
              onClick={() => onSeasonChange(season.id)}
              className="flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="font-medium">{season.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatSeasonDates(season)}
                </span>
              </div>
              {season.is_current && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
          
          {canManage && isLeagueContext && (
            <>
              {seasons.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Season
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateSeasonModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={onCreateSeason}
      />
    </>
  );
}
