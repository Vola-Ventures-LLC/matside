import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Users, Calendar, Settings, LogOut, Trophy, Building2, Mail, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useUserContext } from '@/contexts/UserContext';
import { cn } from '@/lib/utils';

const teamNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/roster', icon: Users, label: 'Roster' },
  { to: '/meets', icon: Calendar, label: 'Meets' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const leagueNavItems = [
  { to: '/league/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/league/meets', icon: Calendar, label: 'Meet Schedule' },
  { to: '/league/teams', icon: Building2, label: 'Teams' },
  { to: '/league/invitations', icon: Mail, label: 'Invitations' },
  { to: '/league/settings', icon: Settings, label: 'Settings' },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();
  const { currentContext } = useUserContext();

  const isLeagueContext = currentContext?.type === 'league';
  const navItems = isLeagueContext ? leagueNavItems : teamNavItems;

  const handleNavClick = () => {
    setOpen(false);
  };

  const handleSignOut = () => {
    setOpen(false);
    signOut();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="h-16 flex items-center justify-start px-6 border-b border-border">
          <SheetTitle className="font-display text-2xl text-primary tracking-wider">MATSIDE</SheetTitle>
        </SheetHeader>

        {/* Context Indicator */}
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isLeagueContext ? (
              <>
                <Trophy className="w-4 h-4" />
                <span>League Mode</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                <span>Team Mode</span>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Account & Sign Out */}
        <div className="p-4 border-t border-border space-y-1 mt-auto">
          <NavLink
            to="/account"
            onClick={handleNavClick}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-muted'
              )
            }
          >
            <UserCircle className="w-5 h-5" />
            Account
          </NavLink>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted hover:text-destructive transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
