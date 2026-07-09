import { useOrgContext } from "@/hooks/useOrgContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, CreditCard, FileEdit, BarChart3, Sparkles, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { OnboardingDashboardWidget } from "@/components/onboarding/OnboardingDashboardWidget";

export default function OrgDashboard() {
  const navigate = useNavigate();
  const { activeOrg, canManageBilling, canManageMembers, canManageContent, canViewAnalytics } = useOrgContext();
  const { 
    summary, 
    isDismissed, 
    isComplete, 
    isLoading: onboardingLoading,
    undismissOnboarding,
    widgetConfig,
  } = useOnboarding();

  if (!activeOrg) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No organization selected</p>
      </div>
    );
  }

  // Show resume setup card if dismissed but not complete
  const showResumeSetup = isDismissed && !isComplete && !onboardingLoading && summary && summary.total_steps > 0;

  const handleResumeSetup = () => {
    undismissOnboarding();
    // Optionally navigate with param to auto-open chat
    navigate("/org/dashboard?openSetupChat=true");
  };

  const quickLinks = [
    {
      title: "Team Members",
      description: "Manage team access and roles",
      href: "/org/members",
      icon: Users,
      visible: canManageMembers,
    },
    {
      title: "Content Planner",
      description: "Plan and schedule content",
      href: "/content",
      icon: FileEdit,
      visible: canManageContent,
    },
    {
      title: "Analytics",
      description: "View performance metrics",
      href: "/content/analytics",
      icon: BarChart3,
      visible: canViewAnalytics,
    },
    {
      title: "Billing",
      description: "Manage subscription and payments",
      href: "/org/billing",
      icon: CreditCard,
      visible: canManageBilling,
    },
  ].filter(link => link.visible);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 w-fit">
          <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{activeOrg.organization.name}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Organization dashboard
          </p>
        </div>
      </div>

      {/* Onboarding Widget - shows when not dismissed/complete */}
      <OnboardingDashboardWidget />

      {/* Resume Setup Card - shows when dismissed but not complete */}
      {showResumeSetup && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{widgetConfig.title}</p>
                <p className="text-sm text-muted-foreground">
                  {summary.completed_steps} of {summary.total_steps} steps completed
                </p>
              </div>
            </div>
            <Button onClick={handleResumeSetup} className="gap-2">
              Resume Setup
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Your Role
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold capitalize">{activeOrg.role}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-primary">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Organization Slug
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-lg font-mono truncate">{activeOrg.organization.slug}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      {quickLinks.length > 0 && (
        <div>
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Access</h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => (
              <Link key={link.href} to={link.href}>
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardHeader className="pb-2">
                    <div className="rounded-lg bg-primary/10 p-2 w-fit">
                      <link.icon className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-sm sm:text-base">{link.title}</CardTitle>
                    <CardDescription className="mt-1 text-xs sm:text-sm">
                      {link.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
