import { ChevronDown, Trophy, Users, Plus, Crown, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserContext, UserContextItem } from '@/contexts/UserContext';
import { useTeam } from '@/contexts/TeamContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function ContextSwitcher() {
  const navigate = useNavigate();
  const { contexts, currentContext, setCurrentContext } = useUserContext();
  const { getTeamRole, currentTeamRole } = useTeam();

  const teamContexts = contexts.filter((c) => c.type === 'team');
  const leagueContexts = contexts.filter((c) => c.type === 'league');

  const handleContextSwitch = (context: UserContextItem) => {
    setCurrentContext(context);
    // Navigate to appropriate dashboard
    if (context.type === 'league') {
      navigate('/league/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const getContextIcon = (type: 'team' | 'league') => {
    return type === 'league' ? Trophy : Users;
  };

  const getContextLabel = () => {
    if (!currentContext) return 'Select Context';
    if (currentContext.type === 'league') {
      const leagueContext = currentContext as { role: string };
      return leagueContext.role === 'organizer' ? 'League Organizer' : 'League Admin';
    }
    const role = getTeamRole(currentContext.id);
    return role === 'owner' ? 'Team Owner' : 'Team Manager';
  };

  const getRoleBadge = (role: 'owner' | 'manager' | 'organizer' | 'admin') => {
    if (role === 'owner' || role === 'organizer') {
      return (
        <span className="flex items-center gap-1 text-xs text-primary">
          <Crown className="w-3 h-3" />
          {role === 'owner' ? 'Owner' : 'Organizer'}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Shield className="w-3 h-3" />
        {role === 'manager' ? 'Manager' : 'Admin'}
      </span>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-[240px] justify-between">
          <div className="flex items-center gap-2">
            {currentContext && (
              <>
                <div
                  className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: currentContext.primary_color }}
                >
                  {currentContext.type === 'league' ? (
                    <Trophy className="w-4 h-4" />
                  ) : (
                    currentContext.abbreviation.slice(0, 2)
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span
                    className="font-medium text-sm"
                    style={{ color: currentContext.primary_color }}
                  >
                    {currentContext.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{getContextLabel()}</span>
                </div>
              </>
            )}
            {!currentContext && <span className="text-muted-foreground">Select Context</span>}
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px] bg-popover border-border z-50">
        {/* Teams Section */}
        {teamContexts.length > 0 && (
          <>
            <DropdownMenuLabel className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              Teams
            </DropdownMenuLabel>
            {teamContexts.map((context) => {
              const isActive = currentContext?.id === context.id && currentContext?.type === context.type;
              const role = getTeamRole(context.id);
              return (
                <DropdownMenuItem
                  key={`team-${context.id}`}
                  onClick={() => handleContextSwitch(context)}
                  className={`gap-3 cursor-pointer ${isActive ? 'bg-accent' : ''}`}
                >
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: context.primary_color }}
                  >
                    {context.abbreviation.slice(0, 2)}
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{context.name}</span>
                    {role && getRoleBadge(role)}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        {/* Leagues Section */}
        {leagueContexts.length > 0 && (
          <>
            {teamContexts.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="w-4 h-4" />
              Leagues
            </DropdownMenuLabel>
            {leagueContexts.map((context) => {
              const isActive = currentContext?.id === context.id && currentContext?.type === context.type;
              const leagueContext = context as { role: 'organizer' | 'admin' } & typeof context;
              return (
                <DropdownMenuItem
                  key={`league-${context.id}`}
                  onClick={() => handleContextSwitch(context)}
                  className={`gap-3 cursor-pointer ${isActive ? 'bg-accent' : ''}`}
                >
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-white"
                    style={{ backgroundColor: context.primary_color }}
                  >
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{context.name}</span>
                    {getRoleBadge(leagueContext.role)}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        {/* Create New Options */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate('/onboarding?action=create-team')}
          className="gap-3 cursor-pointer text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4" />
          <span>Create Team</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate('/league/create')}
          className="gap-3 cursor-pointer text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4" />
          <span>Create League</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
