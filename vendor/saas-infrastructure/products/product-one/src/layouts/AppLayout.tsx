import { useState, createContext, useContext } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoleContext } from "@/hooks/useRoleContext";
import { useOrgContext } from "@/hooks/useOrgContext";
import { useAppFeatures } from "@/hooks/useAppFeatures";
import { RoleContextSwitcher } from "@/components/RoleContextSwitcher";
import { OrgSwitcher } from "@/components/OrgSwitcher";
import { SupportChatWidget } from "@/components/support/SupportChatWidget";
import { OnboardingSidebarWidget } from "@/components/onboarding";
import { OnboardingReturnHandler } from "@/components/onboarding/OnboardingReturnHandler";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  Users,
  HelpCircle,
  LogOut,
  Menu,
  Shield,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  BarChart3,
  FileEdit,
  BookOpen,
  Settings,
  Crown,
  Newspaper,
  CreditCard,
  Coins,
  Unlock,
  Building2,
  FileText,
  MessageSquare,
  MessageCircle,
  Lightbulb,
  HeadphonesIcon,
  Globe,
  Mail,
  Gift,
  Layers,
  Wallet,
  Package,
  PanelLeftClose,
  PanelLeft,
  Ticket,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

// Context for sidebar collapse state
const SidebarCollapseContext = createContext<{
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}>({ isCollapsed: false, setIsCollapsed: () => {} });

const useSidebarCollapse = () => useContext(SidebarCollapseContext);

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  ownerOnly?: boolean;
  featureFlag?: "blog" | "referrals";
  orgPermission?: "billing" | "members" | "content" | "analytics" | "owner";
}

interface NavSection {
  title: string;
  icon: React.ElementType;
  items: NavItem[];
  requireOwner?: boolean;
  featureFlag?: "blog" | "referrals";
  orgPermission?: "billing" | "members" | "content" | "analytics" | "owner";
  excludeFromPlatformAdmin?: boolean;
}

// User context - Dashboard is standalone (no sections needed)
const userNavSections: NavSection[] = [];

// Standalone dashboard link for user context
const userDashboardLink: NavItem = { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard };

// Standalone dashboard link for org context
const orgDashboardLink: NavItem = { label: "Dashboard", href: "/org/dashboard", icon: LayoutDashboard };

// Organization context menu items (when user selects an org)
const orgNavSections: NavSection[] = [
  {
    title: "Team",
    icon: Users,
    orgPermission: "members",
    items: [
      { label: "Members", href: "/team/members", icon: Users },
    ],
  },
  {
    title: "Billing",
    icon: CreditCard,
    orgPermission: "billing",
    items: [
      { label: "Subscription", href: "/billing", icon: CreditCard },
      { label: "Usage", href: "/billing/usage", icon: BarChart3 },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    orgPermission: "owner",
    items: [
      { label: "Organization", href: "/settings/org", icon: Building2 },
    ],
  },
];

// Standalone dashboard link for admin context
const adminDashboardLink: NavItem = { label: "Dashboard", href: "/admin", icon: Shield };

// Admin context menu items - grouped by section
const adminNavSections: NavSection[] = [
  {
    title: "Users",
    icon: User,
    items: [
      { label: "User Management", href: "/admin/users", icon: User },
      { label: "Organizations", href: "/admin/orgs", icon: Building2 },
      { label: "Admin Roles", href: "/admin/roles", icon: Crown },
      { label: "Login Events", href: "/admin/users/logins", icon: Shield },
      { label: "Analytics", href: "/admin/users/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Support & Feedback",
    icon: HeadphonesIcon,
    items: [
      { label: "Support Tickets", href: "/admin/support", icon: MessageSquare },
      { label: "Insights", href: "/admin/support/insights", icon: Lightbulb },
      { label: "User Guides", href: "/admin/guides", icon: BookOpen },
    ],
  },
  {
    title: "Communications",
    icon: Mail,
    items: [
      { label: "Behavior Drips", href: "/admin/drips", icon: Mail },
      { label: "Templates", href: "/admin/templates", icon: FileText },
      { label: "Email Domains", href: "/admin/email/domains", icon: Globe },
      { label: "Email Health", href: "/admin/email", icon: Mail },
    ],
  },
  {
    title: "Content",
    icon: FileEdit,
    items: [
      { label: "Content Planner", href: "/admin/content", icon: FileEdit },
      { label: "Blog Manager", href: "/admin/blog", icon: Newspaper, featureFlag: "blog" },
      { label: "Analytics", href: "/admin/content/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Billing",
    icon: Crown,
    items: [
      { label: "Overview", href: "/admin/billing/overview", icon: LayoutDashboard },
      { label: "All Products", href: "/admin/billing/all-products", icon: Package },
      { label: "Configuration", href: "/admin/billing", icon: Settings },
      { label: "Subscriptions", href: "/admin/billing/subscriptions", icon: CreditCard },
      { label: "Credit Packs", href: "/admin/billing/credits", icon: Coins },
      { label: "One-Time", href: "/admin/billing/products", icon: Unlock },
      { label: "Coupons", href: "/admin/billing/coupons", icon: Ticket },
      { label: "Connect", href: "/admin/billing/connect", icon: Building2 },
      { label: "Analytics", href: "/admin/billing/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Affiliates",
    icon: Gift,
    featureFlag: "referrals",
    items: [
      { label: "Overview", href: "/admin/affiliates", icon: Gift },
      { label: "Affiliates", href: "/admin/affiliates/list", icon: Users },
      { label: "Tiers", href: "/admin/affiliates/tiers", icon: Layers },
      { label: "Payouts", href: "/admin/affiliates/payouts", icon: Wallet },
      { label: "Settings", href: "/admin/affiliates/settings", icon: Settings },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    items: [
      { label: "Brand Assets", href: "/admin/brand", icon: Settings },
      { label: "Changelog", href: "/admin/changelog", icon: BookOpen },
      { label: "Audit Trail", href: "/admin/audit", icon: Shield },
    ],
  },
  {
    title: "Guides",
    icon: BookOpen,
    items: [
      { label: "Onboarding", href: "/admin/onboarding", icon: Sparkles },
      { label: "Setup Guide", href: "/admin/setup", icon: BookOpen },
      { label: "Project Docs", href: "/admin/docs", icon: FileText },
    ],
  },
];

function NavLink({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}) {
  const { isCollapsed } = useSidebarCollapse();

  const linkContent = (
    <Link
      to={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        isCollapsed && "justify-center px-2"
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {!isCollapsed && item.label}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

function CollapsibleNavSection({
  section,
  currentPath,
  onClose,
  isOwner,
  blogEnabled,
  referralsEnabled,
}: {
  section: NavSection;
  currentPath: string;
  onClose?: () => void;
  isOwner: boolean;
  blogEnabled: boolean;
  referralsEnabled: boolean;
}) {
  const { isCollapsed } = useSidebarCollapse();

  // Filter items based on feature flags
  const filteredItems = section.items.filter((item) => {
    if (item.ownerOnly && !isOwner) return false;
    if (item.featureFlag === "blog" && !blogEnabled) return false;
    if (item.featureFlag === "referrals" && !referralsEnabled) return false;
    return true;
  });

  const isAnyActive = filteredItems.some(
    (item) => currentPath === item.href || currentPath.startsWith(item.href + "/")
  );
  const [isOpen, setIsOpen] = useState(isAnyActive);

  // Don't render section if no items left
  if (filteredItems.length === 0) return null;

  // Collapsed mode: show section icon with tooltip dropdown
  if (isCollapsed) {
    return (
      <DropdownMenu>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
                  isAnyActive && "bg-muted text-foreground"
                )}
              >
                <section.icon className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-semibold">
            {section.title}
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent side="right" align="start" className="w-48">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {section.title}
          </div>
          {filteredItems.map((item) => (
            <DropdownMenuItem key={item.href} asChild>
              <Link
                to={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2",
                  currentPath === item.href && "bg-accent"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.ownerOnly && <Crown className="ml-auto h-3 w-3 text-primary" />}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
        <div className="flex items-center gap-2">
          <section.icon className="h-4 w-4" />
          {section.title}
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 pt-1">
        {filteredItems.map((item) => (
          <div key={item.href} className="relative">
            <NavLink
              item={item}
              isActive={currentPath === item.href}
              onClick={onClose}
            />
            {!isCollapsed && item.ownerOnly && (
              <Crown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-primary" />
            )}
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function SidebarContent({ 
  onClose,
  blogEnabled,
  referralsEnabled,
  orgsEnabled,
  showCollapseToggle = false,
}: { 
  onClose?: () => void;
  blogEnabled: boolean;
  referralsEnabled: boolean;
  orgsEnabled: boolean;
  showCollapseToggle?: boolean;
}) {
  const location = useLocation();
  const { isOwner } = useAuth();
  const { activeContext, availableContexts } = useRoleContext();
  const { isCollapsed, setIsCollapsed } = useSidebarCollapse();
  const { 
    isPersonalContext, 
    canManageBilling, 
    canManageMembers, 
    canManageContent, 
    canViewAnalytics,
    isOrgOwner,
  } = useOrgContext();

  // Determine which nav sections and dashboard link to show based on context
  const getNavConfig = () => {
    // Platform admin mode (personal context + admin)
    if (isPersonalContext && activeContext === "admin") {
      return { sections: adminNavSections, dashboardLink: adminDashboardLink };
    }
    // Organization context
    if (!isPersonalContext && orgsEnabled) {
      return { sections: orgNavSections, dashboardLink: orgDashboardLink };
    }
    // Personal user context
    return { sections: userNavSections, dashboardLink: userDashboardLink };
  };

  const { sections: navSections, dashboardLink } = getNavConfig();

  // Check if user has org permission
  const hasOrgPermission = (permission?: string) => {
    if (!permission) return true;
    switch (permission) {
      case "billing": return canManageBilling;
      case "members": return canManageMembers;
      case "content": return canManageContent;
      case "analytics": return canViewAnalytics;
      case "owner": return isOrgOwner;
      default: return true;
    }
  };

  // Check if we're in platform admin mode
  const isPlatformAdminMode = isPersonalContext && activeContext === "admin";

  // Filter sections based on permissions and feature flags
  const filteredSections = navSections.filter((section) => {
    if (section.requireOwner && !isOwner) return false;
    if (section.featureFlag === "blog" && !blogEnabled) return false;
    if (section.featureFlag === "referrals" && !referralsEnabled) return false;
    if (section.orgPermission && !hasOrgPermission(section.orgPermission)) return false;
    if (section.excludeFromPlatformAdmin && isPlatformAdminMode) return false;
    return true;
  });

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {/* Logo and Collapse Toggle */}
        <div className={cn(
          "flex h-16 items-center border-b",
          isCollapsed ? "justify-center px-2" : "px-4 justify-between"
        )}>
          <Link to="/dashboard" className="flex items-center gap-2" onClick={onClose}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
              <span className="text-sm font-bold text-primary-foreground">S</span>
            </div>
            {!isCollapsed && <span className="text-lg font-semibold">SaaS Starter</span>}
          </Link>

          {/* Collapse Toggle - desktop only */}
          {showCollapseToggle && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                >
                  {isCollapsed ? (
                    <PanelLeft className="h-4 w-4" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Org Switcher - show if orgs are enabled and not collapsed */}
        {orgsEnabled && !isCollapsed && (
          <div className="border-b">
            <OrgSwitcher />
          </div>
        )}

        {/* Context Switcher - only show if user has multiple contexts AND orgs not enabled */}
        {availableContexts.length > 1 && !orgsEnabled && !isCollapsed && (
          <div className="px-4 py-3 border-b">
            <RoleContextSwitcher />
          </div>
        )}

        {/* Onboarding Setup Widget - shown above navigation */}
        {!isCollapsed && <OnboardingSidebarWidget onClose={onClose} />}

        {/* Navigation */}
        <nav className={cn(
          "flex-1 overflow-y-auto space-y-2",
          isCollapsed ? "p-2" : "p-4"
        )}>
          {/* Standalone Dashboard Link */}
          <NavLink
            item={dashboardLink}
            isActive={location.pathname === dashboardLink.href}
            onClick={onClose}
          />

          {/* Collapsible Sections */}
          {filteredSections.map((section) => (
            <CollapsibleNavSection
              key={section.title}
              section={section}
              currentPath={location.pathname}
              onClose={onClose}
              isOwner={isOwner}
              blogEnabled={blogEnabled}
              referralsEnabled={referralsEnabled}
            />
          ))}
        </nav>
      </div>
    </TooltipProvider>
  );
}

function UserMenu({
  onOpenSupportChat,
  referralsEnabled,
  onResumeSetup,
  showResumeSetup,
}: {
  onOpenSupportChat: () => void;
  referralsEnabled: boolean;
  onResumeSetup?: () => void;
  showResumeSetup?: boolean;
}) {
  const { user, profile, signOut, isAdmin, isOwner } = useAuth();
  const { activeContext, setActiveContext } = useRoleContext();
  const { isPersonalContext, switchToOrg } = useOrgContext();
  const navigate = useNavigate();

  const hasAdminAccess = isAdmin || isOwner;
  const isInAdminMode = isPersonalContext && activeContext === "admin";

  const handleSelectAdmin = () => {
    switchToOrg(null);
    setActiveContext("admin");
  };

  const handleSelectPersonal = () => {
    switchToOrg(null);
    setActiveContext("user");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials =
    profile?.display_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || user?.email?.[0].toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {profile?.display_name && (
              <p className="font-medium">{profile.display_name}</p>
            )}
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            {(isAdmin || isOwner) && (
              <p className="text-xs text-primary flex items-center gap-1">
                {isOwner ? <Crown className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                {isOwner ? "Owner" : "Admin"}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        {referralsEnabled && (
          <DropdownMenuItem asChild>
            <Link to="/referrals" className="cursor-pointer">
              <Gift className="mr-2 h-4 w-4" />
              Referrals
            </Link>
          </DropdownMenuItem>
        )}
        {showResumeSetup && onResumeSetup && (
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onResumeSetup(); }} className="cursor-pointer">
            <MessageCircle className="mr-2 h-4 w-4" />
            Chat to Setup
          </DropdownMenuItem>
        )}
        {hasAdminAccess && (
          <>
            <DropdownMenuSeparator />
            {isInAdminMode ? (
              <DropdownMenuItem onClick={handleSelectPersonal} className="cursor-pointer">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Personal
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleSelectAdmin} className="cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
                Platform Admin
              </DropdownMenuItem>
            )}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/guides" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
            <BookOpen className="mr-2 h-4 w-4" />
            User Guides
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onOpenSupportChat(); }} className="cursor-pointer">
          <HeadphonesIcon className="mr-2 h-4 w-4" />
          Help & Feedback
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [supportChatOpen, setSupportChatOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Persist collapse state in localStorage
    const stored = localStorage.getItem("sidebar-collapsed");
    return stored === "true";
  });
  const location = useLocation();
  const { isImpersonating, user } = useAuth();
  const { activeContext } = useRoleContext();
  const { blogEnabled, referralsEnabled, orgsEnabled } = useAppFeatures();
  const { activeOrgId } = useOrgContext();
  
  // Use context-aware onboarding hook for profile menu state
  const { isDismissed: onboardingDismissed, isComplete: onboardingComplete, resumeConversation } = useOnboarding();

  // Persist collapse state
  const handleSetCollapsed = (value: boolean) => {
    setIsCollapsed(value);
    localStorage.setItem("sidebar-collapsed", String(value));
  };

  // Get breadcrumb from current path - format readable page titles
  const pathSegments = location.pathname.split("/").filter(Boolean);
  
  // Build readable breadcrumb, skipping UUIDs
  const getPageTitle = () => {
    // Check for specific route patterns and return friendly names
    if (location.pathname.includes("/admin/guides/sections/")) {
      return "User Guides";
    }
    if (location.pathname.includes("/admin/guides/articles/")) {
      return "User Guides";
    }
    if (location.pathname.includes("/admin/blog/")) {
      return "Blog Manager";
    }
    if (location.pathname.includes("/admin/support/tickets/")) {
      return "Support Tickets";
    }
    
    // Default: use last non-UUID segment
    const nonUuidSegments = pathSegments.filter(
      seg => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg)
    );
    const currentPage = nonUuidSegments[nonUuidSegments.length - 1] || "dashboard";
    return currentPage.charAt(0).toUpperCase() + currentPage.slice(1).replace(/-/g, " ");
  };
  
  const pageTitle = getPageTitle();

  return (
    <SidebarCollapseContext.Provider value={{ isCollapsed, setIsCollapsed: handleSetCollapsed }}>
      <div className={cn("flex min-h-screen w-full", isImpersonating && "pt-10")}>
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden flex-shrink-0 border-r bg-sidebar md:block transition-[width] duration-200 ease-in-out",
            isCollapsed ? "w-16" : "w-64"
          )}
        >
          <SidebarContent 
            blogEnabled={blogEnabled} 
            referralsEnabled={referralsEnabled} 
            orgsEnabled={orgsEnabled}
            showCollapseToggle
          />
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent 
              onClose={() => setMobileOpen(false)} 
              blogEnabled={blogEnabled} 
              referralsEnabled={referralsEnabled}
              orgsEnabled={orgsEnabled}
            />
          </SheetContent>
        </Sheet>

        {/* Support Chat Widget */}
        <SupportChatWidget open={supportChatOpen} onOpenChange={setSupportChatOpen} />

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          {/* Top Header */}
          <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
            {/* Spacer for mobile menu button */}
            <div className="w-10 md:hidden" />

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {activeContext === "admin" ? "Admin" : "Home"}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{pageTitle}</span>
            </div>

            {/* Right side */}
            <div className="ml-auto flex items-center gap-2">
              <NotificationBell />
              <UserMenu 
                onOpenSupportChat={() => setSupportChatOpen(true)} 
                referralsEnabled={referralsEnabled}
                showResumeSetup={onboardingDismissed && !onboardingComplete}
                onResumeSetup={async () => {
                  if (user) {
                    // Clear dismissed state for current context (personal or org)
                    const contextKey = activeOrgId ? `org_${activeOrgId}` : "personal";
                    const dismissedKey = `onboarding_dismissed_${user.id}_${contextKey}`;
                    localStorage.removeItem(dismissedKey);
                    // Resume conversation (hook will refetch state)
                    await resumeConversation();
                    // Navigate to dashboard with param to auto-open chat
                    window.location.href = "/dashboard?openSetupChat=true";
                  }
                }}
              />
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 lg:p-6">
            <OnboardingReturnHandler>
              <Outlet />
            </OnboardingReturnHandler>
          </main>
        </div>
      </div>
    </SidebarCollapseContext.Provider>
  );
}
