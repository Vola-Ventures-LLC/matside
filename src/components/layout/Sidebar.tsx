import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  LogOut,
  Trophy,
  Building2,
  Mail,
  UserCircle,
} from 'lucide-react';
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

export function Sidebar() {
  const { signOut } = useAuth();
  const { currentContext } = useUserContext();

  const isLeagueContext = currentContext?.type === 'league';
  const navItems = isLeagueContext ? leagueNavItems : teamNavItems;

  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <h1 className="font-display text-3xl text-primary tracking-wider">MATSIDE</h1>
      </div>

      {/* Context Indicator */}
      <div className="px-4 py-3 border-b border-sidebar-border">
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
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Account & Sign Out */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        <NavLink
          to="/account"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
            )
          }
        >
          <UserCircle className="w-5 h-5" />
          Account
        </NavLink>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-destructive transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
