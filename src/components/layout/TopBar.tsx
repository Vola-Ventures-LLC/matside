import { ContextSwitcher } from './ContextSwitcher';
import { MobileNav } from './MobileNav';
import { useUserContext } from '@/contexts/UserContext';

export function TopBar() {
  const { currentContext } = useUserContext();

  const getContextTypeLabel = () => {
    if (!currentContext) return '';
    return currentContext.type === 'league' ? 'League Organizer' : 'Team Manager';
  };

  return (
    <header className="h-14 md:h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger menu */}
        <MobileNav />
        
        {/* Mobile logo */}
        <h1 className="font-display text-xl text-primary tracking-wider md:hidden">MATSIDE</h1>
        
        {/* Desktop context switcher */}
        <div className="hidden md:block">
          <ContextSwitcher />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Future: notifications, user menu, etc. */}
      </div>
    </header>
  );
}
