import { useAuth } from "@/hooks/useAuth";
import { useReferralTracking } from "@/hooks/useReferralTracking";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Settings, TrendingUp, BookOpen, ArrowRight, HeadphonesIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { OnboardingDashboardWidget } from "@/components/onboarding";

const stats = [
  {
    title: "Total Users",
    value: "—",
    description: "Registered users",
    icon: Users,
  },
  {
    title: "Active Sessions",
    value: "—",
    description: "Currently online",
    icon: TrendingUp,
  },
  {
    title: "Settings",
    value: "3",
    description: "Configurable options",
    icon: Settings,
  },
  {
    title: "Dashboard",
    value: "1",
    description: "Active workspace",
    icon: LayoutDashboard,
  },
];

export default function Dashboard() {
  const { profile } = useAuth();
  
  // Process any pending referral attribution
  useReferralTracking();

  return (
    <div className="space-y-8 animate-in">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your account today.
        </p>
      </div>

      {/* Onboarding Widget */}
      <OnboardingDashboardWidget />

      {/* Help Banner */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Need help getting started?</h3>
                <p className="text-muted-foreground text-sm">
                  Check out our comprehensive guides to learn everything about the platform.
                </p>
              </div>
            </div>
            <Button asChild>
              <a href="/guides" target="_blank" rel="noopener noreferrer">
                Browse User Guides
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts to help you get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link to="/settings" className="rounded-lg border p-4 transition-colors hover:bg-muted/50 block">
              <h3 className="font-medium">Complete your profile</h3>
              <p className="text-sm text-muted-foreground">
                Add your details and upload an avatar
              </p>
            </Link>
            <a href="/guides" target="_blank" rel="noopener noreferrer" className="rounded-lg border p-4 transition-colors hover:bg-muted/50 block">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-4 w-4 text-primary" />
                <h3 className="font-medium">User Guides</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Learn how to use all features
              </p>
            </a>
            <Link to="/support" className="rounded-lg border p-4 transition-colors hover:bg-muted/50 block">
              <div className="flex items-center gap-2 mb-1">
                <HeadphonesIcon className="h-4 w-4 text-primary" />
                <h3 className="font-medium">Get support</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                View tickets or start a conversation
              </p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
