import { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { GripVertical, Clock, Flag, MessageSquare, Check, AlertTriangle, Filter, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Wrestler {
  id: string;
  first_name: string;
  last_name: string;
  team_abbreviation: string;
  team_color: string | null;
  attendance_status: string;
  is_flagged: boolean;
  flag_reason: string | null;
  discussion_flag: { id: string; note: string | null } | null;
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
  scratched_wrestler_id: string | null;
}

interface MatColumnsViewProps {
  matches: Match[];
  matsWithMatches: number[];
  isHost: boolean;
  onMatchesReorder: (updates: { id: string; mat_number: number; match_order: number }[]) => Promise<void>;
  getContrastColor: (color: string | null) => string;
  conflictMinGap: number;
}

// Droppable mat container that accepts items from any sortable context
function DroppableMatColumn({ 
  matNumber, 
  children 
}: { 
  matNumber: number; 
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `mat-column-${matNumber}`,
    data: { type: 'column', matNumber },
  });

  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        "space-y-2 p-2 min-h-[200px] rounded-lg transition-all duration-200",
        isOver && "bg-primary/10 ring-2 ring-primary/50"
      )}
    >
      {children}
    </div>
  );
}

interface SortableMatchCardProps {
  match: Match;
  matchIndex: number;
  matNumber: number;
  isHost: boolean;
  getContrastColor: (color: string | null) => string;
  isHighlighted?: boolean;
  conflictWrestlerIds?: Set<string>;
  onWrestlerClick?: (wrestler: Wrestler) => void;
}

function SortableMatchCard({ match, matchIndex, matNumber, isHost, getContrastColor, isHighlighted, conflictWrestlerIds, onWrestlerClick }: SortableMatchCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: match.id, 
    disabled: !isHost,
    data: { type: 'match', matNumber, match },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasConflict = conflictWrestlerIds && conflictWrestlerIds.size > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-card border rounded-lg p-3 transition-all duration-200',
        isDragging && 'border-primary shadow-lg z-50',
        isHost && 'cursor-grab active:cursor-grabbing',
        hasConflict && !isHighlighted && 'ring-2 ring-destructive bg-destructive/10 border-destructive',
        isHighlighted && 'ring-2 ring-green-500 bg-green-500/10 border-green-500'
      )}
    >
      <MatchCardContent
        match={match}
        matchIndex={matchIndex}
        matNumber={matNumber}
        isHost={isHost}
        getContrastColor={getContrastColor}
        dragHandleProps={isHost ? { ...attributes, ...listeners } : undefined}
        isHighlighted={isHighlighted}
        conflictWrestlerIds={conflictWrestlerIds}
        onWrestlerClick={onWrestlerClick}
      />
    </div>
  );
}

interface MatchCardContentProps {
  match: Match;
  matchIndex: number;
  matNumber: number;
  isHost: boolean;
  getContrastColor: (color: string | null) => string;
  dragHandleProps?: Record<string, unknown>;
  isOverlay?: boolean;
  isHighlighted?: boolean;
  conflictWrestlerIds?: Set<string>;
  onWrestlerClick?: (wrestler: Wrestler) => void;
}

function MatchCardContent({ match, matchIndex, matNumber, isHost, getContrastColor, dragHandleProps, isOverlay, isHighlighted, conflictWrestlerIds, onWrestlerClick }: MatchCardContentProps) {
  const matchNumber = (matNumber * 100) + matchIndex;
  const wrestlerA = match.wrestler_a;
  const wrestlerB = match.wrestler_b;

  const getWrestlerTags = (wrestler: Wrestler | null, hasBufferConflict: boolean) => {
    if (!wrestler) return null;
    const tags = [];
    
    if (hasBufferConflict) {
      tags.push(
        <Badge 
          key="buffer" 
          className="bg-destructive text-destructive-foreground text-xs px-1 cursor-pointer hover:bg-destructive/80"
          onClick={(e) => {
            e.stopPropagation();
            onWrestlerClick?.(wrestler);
          }}
        >
          <AlertTriangle className="w-3 h-3 mr-0.5" />
          Buffer
        </Badge>
      );
    }
    if (wrestler.attendance_status === 'arriving_late') {
      tags.push(
        <Badge key="late" variant="outline" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-xs px-1">
          <Clock className="w-3 h-3 mr-0.5" />
          Late
        </Badge>
      );
    }
    if (wrestler.attendance_status === 'leaving_early') {
      tags.push(
        <Badge key="early" variant="outline" className="bg-orange-500/20 text-orange-500 border-orange-500/30 text-xs px-1">
          <Clock className="w-3 h-3 mr-0.5" />
          Early
        </Badge>
      );
    }
    if (wrestler.is_flagged) {
      tags.push(
        <Badge key="auto" variant="outline" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-xs px-1" title={wrestler.flag_reason || ''}>
          <Flag className="w-3 h-3" />
        </Badge>
      );
    }
    if (wrestler.discussion_flag) {
      tags.push(
        <Badge key="discuss" variant="outline" className="bg-blue-500/20 text-blue-500 border-blue-500/30 text-xs px-1" title={wrestler.discussion_flag.note || ''}>
          <MessageSquare className="w-3 h-3" />
        </Badge>
      );
    }
    
    return tags.length > 0 ? tags : null;
  };

  const wrestlerAHasConflict = conflictWrestlerIds?.has(match.wrestler_a_id) || false;
  const wrestlerBHasConflict = conflictWrestlerIds?.has(match.wrestler_b_id) || false;

  return (
    <div className={cn("flex items-start gap-2", isOverlay && "bg-card border rounded-lg p-3 shadow-xl")}>
      {isHost && dragHandleProps && (
        <div {...dragHandleProps} className="pt-0.5 text-muted-foreground hover:text-foreground cursor-grab">
          <GripVertical className="w-4 h-4" />
        </div>
      )}
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-sm text-muted-foreground">#{matchNumber}</span>
          <div className="flex items-center gap-1">
            {isHighlighted && (
              <Badge className="bg-green-500 text-white text-xs px-1.5 py-0.5 animate-fade-in">
                <Check className="w-3 h-3 mr-0.5" />
                Moved
              </Badge>
            )}
          </div>
        </div>
        
        {/* Wrestler A */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{wrestlerA?.first_name} {wrestlerA?.last_name}</span>
          <Badge
            className="text-xs"
            style={{
              backgroundColor: wrestlerA?.team_color || 'hsl(var(--muted))',
              color: getContrastColor(wrestlerA?.team_color || null),
            }}
          >
            {wrestlerA?.team_abbreviation}
          </Badge>
          {getWrestlerTags(wrestlerA, wrestlerAHasConflict)}
        </div>
        
        <div className="text-xs text-muted-foreground text-center">vs</div>
        
        {/* Wrestler B */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{wrestlerB?.first_name} {wrestlerB?.last_name}</span>
          <Badge
            className="text-xs"
            style={{
              backgroundColor: wrestlerB?.team_color || 'hsl(var(--muted))',
              color: getContrastColor(wrestlerB?.team_color || null),
            }}
          >
            {wrestlerB?.team_abbreviation}
          </Badge>
          {getWrestlerTags(wrestlerB, wrestlerBHasConflict)}
        </div>
      </div>
    </div>
  );
}

export function MatColumnsView({ 
  matches, 
  matsWithMatches, 
  isHost, 
  onMatchesReorder,
  getContrastColor,
  conflictMinGap,
}: MatColumnsViewProps) {
  const [showOnlyConflicts, setShowOnlyConflicts] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [highlightedMatchIds, setHighlightedMatchIds] = useState<Set<string>>(new Set());
  const [selectedConflictWrestler, setSelectedConflictWrestler] = useState<Wrestler | null>(null);
  // Local state to track items during drag - initialized from props
  const [items, setItems] = useState<Record<number, string[]>>(() => {
    const result: Record<number, string[]> = {};
    matsWithMatches.forEach(matNumber => {
      result[matNumber] = matches
        .filter(m => m.mat_number === matNumber)
        .sort((a, b) => (a.match_order ?? 0) - (b.match_order ?? 0))
        .map(m => m.id);
    });
    return result;
  });

  // Sync local state when props change (after save)
  useEffect(() => {
    const newItems: Record<number, string[]> = {};
    matsWithMatches.forEach(matNumber => {
      newItems[matNumber] = matches
        .filter(m => m.mat_number === matNumber)
        .sort((a, b) => (a.match_order ?? 0) - (b.match_order ?? 0))
        .map(m => m.id);
    });
    setItems(newItems);
  }, [matches, matsWithMatches]);

  // Create a lookup map for matches
  const matchesMap = useMemo(() => {
    const map = new Map<string, Match>();
    matches.forEach(m => map.set(m.id, m));
    return map;
  }, [matches]);

  // Calculate buffer conflicts - track which wrestlers have conflicts in which matches
  const conflictWrestlerMatchMap = useMemo(() => {
    // Map of matchId -> Set of wrestlerIds that have conflicts in that match
    const conflicts = new Map<string, Set<string>>();
    
    // Track wrestler appearances: wrestlerId -> array of { matchId, globalSlot }
    const wrestlerAppearances = new Map<string, { matchId: string; globalSlot: number }[]>();
    
    matsWithMatches.forEach(matNumber => {
      const matMatchIds = items[matNumber] || [];
      matMatchIds.forEach((matchId, slotIndex) => {
        const match = matchesMap.get(matchId);
        if (!match) return;
        
        [match.wrestler_a_id, match.wrestler_b_id].forEach(wrestlerId => {
          if (!wrestlerAppearances.has(wrestlerId)) {
            wrestlerAppearances.set(wrestlerId, []);
          }
          wrestlerAppearances.get(wrestlerId)!.push({ matchId, globalSlot: slotIndex });
        });
      });
    });

    // Check each wrestler's matches for buffer violations
    wrestlerAppearances.forEach((appearances, wrestlerId) => {
      if (appearances.length < 2) return;
      
      // Sort by global slot
      appearances.sort((a, b) => a.globalSlot - b.globalSlot);
      
      // Check gaps between consecutive matches
      for (let i = 1; i < appearances.length; i++) {
        const gap = appearances[i].globalSlot - appearances[i - 1].globalSlot;
        if (gap < conflictMinGap) {
          // Mark this wrestler as having a conflict in both matches
          [appearances[i].matchId, appearances[i - 1].matchId].forEach(matchId => {
            if (!conflicts.has(matchId)) {
              conflicts.set(matchId, new Set());
            }
            conflicts.get(matchId)!.add(wrestlerId);
          });
        }
      }
    });

    return conflicts;
  }, [items, matsWithMatches, matchesMap, conflictMinGap]);

  // Count total matches with buffer conflicts
  const conflictMatchCount = conflictWrestlerMatchMap.size;

  // Get set of match IDs with conflicts for filtering
  const conflictMatchIds = useMemo(() => {
    return new Set(conflictWrestlerMatchMap.keys());
  }, [conflictWrestlerMatchMap]);

  // Get matches for the selected wrestler with conflict info
  const selectedWrestlerMatches = useMemo(() => {
    if (!selectedConflictWrestler) return [];
    
    const wrestlerMatches: { match: Match; matNumber: number; slotIndex: number; hasConflict: boolean }[] = [];
    
    matsWithMatches.forEach(matNumber => {
      const matMatchIds = items[matNumber] || [];
      matMatchIds.forEach((matchId, slotIndex) => {
        const match = matchesMap.get(matchId);
        if (!match) return;
        if (match.wrestler_a_id === selectedConflictWrestler.id || match.wrestler_b_id === selectedConflictWrestler.id) {
          const conflictIds = conflictWrestlerMatchMap.get(matchId);
          wrestlerMatches.push({
            match,
            matNumber,
            slotIndex,
            hasConflict: conflictIds?.has(selectedConflictWrestler.id) || false,
          });
        }
      });
    });
    
    // Sort by slot index (timeline order)
    return wrestlerMatches.sort((a, b) => a.slotIndex - b.slotIndex);
  }, [selectedConflictWrestler, items, matsWithMatches, matchesMap, conflictWrestlerMatchMap]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Find which mat container an item belongs to
  const findContainer = (id: string): number | null => {
    // Check if it's a column id
    if (typeof id === 'string' && id.startsWith('mat-column-')) {
      return parseInt(id.replace('mat-column-', ''));
    }
    
    // Otherwise find which mat contains this match
    for (const matNumber of matsWithMatches) {
      if (items[matNumber]?.includes(id)) {
        return matNumber;
      }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // Moving to a different container
    setItems(prev => {
      const activeItems = [...prev[activeContainer]];
      const overItems = [...prev[overContainer]];

      const activeIndex = activeItems.indexOf(activeId);
      
      // Find insertion index
      let overIndex = overItems.indexOf(overId);
      if (overIndex === -1) {
        // Dropped on the column itself, add to end
        overIndex = overItems.length;
      }

      // Remove from source
      activeItems.splice(activeIndex, 1);
      
      // Add to destination
      overItems.splice(overIndex, 0, activeId);

      return {
        ...prev,
        [activeContainer]: activeItems,
        [overContainer]: overItems,
      };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const draggedMatchId = activeId;
    setActiveId(null);

    if (!over || !draggedMatchId) return;

    const overId = over.id as string;

    const activeContainer = findContainer(draggedMatchId);
    let overContainer = findContainer(overId);

    if (!activeContainer) return;
    
    // If dropped on empty space, use active container
    if (!overContainer) {
      overContainer = activeContainer;
    }

    // Calculate final positions and save
    const updates: { id: string; mat_number: number; match_order: number }[] = [];

    // If same container, handle reordering
    if (activeContainer === overContainer) {
      const containerItems = [...items[activeContainer]];
      const oldIndex = containerItems.indexOf(draggedMatchId);
      let newIndex = containerItems.indexOf(overId);
      
      if (newIndex === -1) newIndex = containerItems.length - 1;

      if (oldIndex !== newIndex) {
        const reordered = arrayMove(containerItems, oldIndex, newIndex);
        
        // Update local state immediately
        setItems(prev => ({
          ...prev,
          [activeContainer]: reordered,
        }));

        // Prepare DB updates
        reordered.forEach((matchId, index) => {
          updates.push({
            id: matchId,
            mat_number: activeContainer,
            match_order: (activeContainer * 100) + index,
          });
        });
      }
    } else {
      // Cross-container move - local state already updated in handleDragOver
      // Just prepare DB updates for all affected mats
      matsWithMatches.forEach(matNumber => {
        items[matNumber]?.forEach((matchId, index) => {
          const originalMatch = matchesMap.get(matchId);
          // Only include if mat changed or order changed
          if (originalMatch && (
            originalMatch.mat_number !== matNumber ||
            originalMatch.match_order !== (matNumber * 100) + index
          )) {
            updates.push({
              id: matchId,
              mat_number: matNumber,
              match_order: (matNumber * 100) + index,
            });
          }
        });
      });
    }

    if (updates.length > 0) {
      setHighlightedMatchIds(new Set([draggedMatchId]));
      await onMatchesReorder(updates);
    }
  };

  // Clear highlights after delay
  useEffect(() => {
    if (highlightedMatchIds.size > 0) {
      const timer = setTimeout(() => {
        setHighlightedMatchIds(new Set());
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightedMatchIds]);

  const activeMatch = activeId ? matchesMap.get(activeId) : null;
  const activeMatNumber = activeId ? findContainer(activeId) : null;
  const activeIndex = activeMatch && activeMatNumber 
    ? items[activeMatNumber]?.indexOf(activeId) ?? 0
    : 0;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Buffer Conflict Filter Header */}
      <div className="flex items-center gap-3 mb-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showOnlyConflicts ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnlyConflicts(!showOnlyConflicts)}
                className={cn(
                  "gap-2",
                  conflictMatchCount > 0 && !showOnlyConflicts && "border-destructive text-destructive hover:bg-destructive/10"
                )}
              >
                <AlertTriangle className="w-4 h-4" />
                {conflictMatchCount} Buffer {conflictMatchCount === 1 ? 'Conflict' : 'Conflicts'}
                {showOnlyConflicts && <Filter className="w-3 h-3" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{showOnlyConflicts ? 'Click to show all matches' : 'Click to filter to only buffer conflicts'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {showOnlyConflicts && (
          <span className="text-sm text-muted-foreground">
            Showing only matches with buffer violations
          </span>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {matsWithMatches.map(matNumber => {
          const matMatchIds = items[matNumber] || [];
          // Apply filter if enabled
          const displayMatchIds = showOnlyConflicts 
            ? matMatchIds.filter(id => conflictMatchIds.has(id))
            : matMatchIds;
          const hasConflictsInMat = matMatchIds.some(id => conflictMatchIds.has(id));
          
          // Skip mat entirely if filtering and no conflicts
          if (showOnlyConflicts && displayMatchIds.length === 0) {
            return null;
          }
          
          return (
            <Card key={matNumber} className={cn(
              "flex-shrink-0 w-80",
              hasConflictsInMat && !showOnlyConflicts && "ring-1 ring-destructive/30"
            )}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    Mat {matNumber}
                    {hasConflictsInMat && (
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    )}
                  </span>
                  <Badge variant="outline">
                    {showOnlyConflicts ? `${displayMatchIds.length} conflicts` : `${matMatchIds.length} matches`}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="h-[calc(100vh-400px)] min-h-[400px]">
                  <SortableContext
                    items={matMatchIds}
                    strategy={verticalListSortingStrategy}
                  >
                    <DroppableMatColumn matNumber={matNumber}>
                      {displayMatchIds.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed border-muted rounded-lg">
                          {showOnlyConflicts ? 'No buffer conflicts' : 'Drop matches here'}
                        </div>
                      ) : (
                        displayMatchIds.map((matchId) => {
                          const match = matchesMap.get(matchId);
                          if (!match) return null;
                          // Get original index for match numbering
                          const originalIdx = matMatchIds.indexOf(matchId);
                          return (
                            <SortableMatchCard
                              key={matchId}
                              match={match}
                              matchIndex={originalIdx}
                              matNumber={matNumber}
                              isHost={isHost}
                              getContrastColor={getContrastColor}
                              isHighlighted={highlightedMatchIds.has(matchId)}
                              conflictWrestlerIds={conflictWrestlerMatchMap.get(matchId)}
                              onWrestlerClick={setSelectedConflictWrestler}
                            />
                          );
                        })
                      )}
                    </DroppableMatColumn>
                  </SortableContext>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeMatch && activeMatNumber !== null && (
          <MatchCardContent
            match={activeMatch}
            matchIndex={activeIndex}
            matNumber={activeMatNumber}
            isHost={isHost}
            getContrastColor={getContrastColor}
            isOverlay
          />
        )}
      </DragOverlay>

      {/* Wrestler Buffer Conflict Schedule Sheet */}
      <Sheet open={!!selectedConflictWrestler} onOpenChange={(open) => !open && setSelectedConflictWrestler(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {selectedConflictWrestler?.first_name} {selectedConflictWrestler?.last_name}
            </SheetTitle>
            <SheetDescription>
              <Badge
                style={{
                  backgroundColor: selectedConflictWrestler?.team_color || 'hsl(var(--muted))',
                  color: getContrastColor(selectedConflictWrestler?.team_color || null),
                }}
              >
                {selectedConflictWrestler?.team_abbreviation}
              </Badge>
              <span className="ml-2 text-muted-foreground">Buffer conflict schedule</span>
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-3">
            <div className="text-sm text-muted-foreground mb-2">
              Matches must be at least <span className="font-semibold text-foreground">{conflictMinGap} slots</span> apart
            </div>
            
            {selectedWrestlerMatches.map(({ match, matNumber, slotIndex, hasConflict }, idx) => {
              const opponent = match.wrestler_a_id === selectedConflictWrestler?.id 
                ? match.wrestler_b 
                : match.wrestler_a;
              const matchNumber = (matNumber * 100) + slotIndex;
              
              // Check gap from previous match
              const prevMatch = selectedWrestlerMatches[idx - 1];
              const gapFromPrev = prevMatch ? slotIndex - prevMatch.slotIndex : null;
              
              return (
                <div key={match.id} className="space-y-1">
                  {gapFromPrev !== null && gapFromPrev < conflictMinGap && (
                    <div className="flex items-center gap-2 text-destructive text-xs font-medium pl-2">
                      <AlertTriangle className="w-3 h-3" />
                      Only {gapFromPrev} slot{gapFromPrev !== 1 ? 's' : ''} gap (need {conflictMinGap})
                    </div>
                  )}
                  <div
                    className={cn(
                      "p-3 rounded-lg border",
                      hasConflict ? "border-destructive bg-destructive/10" : "border-border"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-medium">#{matchNumber}</span>
                      <Badge variant="outline">Mat {matNumber}</Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm">vs {opponent?.first_name} {opponent?.last_name}</span>
                      <Badge
                        className="text-xs"
                        style={{
                          backgroundColor: opponent?.team_color || 'hsl(var(--muted))',
                          color: getContrastColor(opponent?.team_color || null),
                        }}
                      >
                        {opponent?.team_abbreviation}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {selectedWrestlerMatches.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">
                No matches found for this wrestler
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </DndContext>
  );
}
