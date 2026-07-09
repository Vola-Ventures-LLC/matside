import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Shield,
  Users,
  CreditCard,
  Mail,
  FileText,
  Palette,
  History,
  FileSearch,
  BarChart3,
  ArrowRight,
  Webhook,
  ShieldAlert,
  Sparkles,
  DollarSign,
} from "lucide-react";

interface QuickLink {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  ownerOnly?: boolean;
}

const quickLinks: QuickLink[] = [
  {
    title: "User Management",
    description: "View and manage registered users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Billing",
    description: "Subscription plans and payments",
    href: "/admin/billing",
    icon: CreditCard,
    ownerOnly: true,
  },
  {
    title: "Blog Manager",
    description: "Create and manage blog posts",
    href: "/admin/blog",
    icon: FileText,
  },
  {
    title: "Brand Assets",
    description: "Manage brand colors and files",
    href: "/admin/brand",
    icon: Palette,
  },
  {
    title: "Message Templates",
    description: "Email and SMS templates",
    href: "/admin/templates",
    icon: Mail,
  },
  {
    title: "Changelog",
    description: "Document platform updates",
    href: "/admin/changelog",
    icon: History,
  },
  {
    title: "Audit Trail",
    description: "Review admin actions",
    href: "/admin/audit",
    icon: FileSearch,
    ownerOnly: true,
  },
  {
    title: "Setup Guide",
    description: "Launch checklist and configuration",
    href: "/admin/setup",
    icon: FileSearch,
    ownerOnly: true,
  },
  {
    title: "Webhooks",
    description: "Configure outgoing event notifications",
    href: "/admin/webhooks",
    icon: Webhook,
    ownerOnly: true,
  },
  {
    title: "Rate Limits",
    description: "Monitor API usage and rate limit alerts",
    href: "/admin/rate-limits",
    icon: ShieldAlert,
    ownerOnly: true,
  },
  {
    title: "Onboarding",
    description: "Configure user onboarding steps and CTAs",
    href: "/admin/onboarding",
    icon: Sparkles,
    ownerOnly: true,
  },
  {
    title: "Cost Monitoring",
    description: "Track AI, email, and SMS costs per account",
    href: "/admin/costs",
    icon: DollarSign,
    ownerOnly: true,
  },
];

export default function Admin() {
  const { isOwner } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    newThisWeek: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: users } = await supabase
      .from("profiles")
      .select("created_at, last_login_at");

    if (users) {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const todayStart = new Date(now.setHours(0, 0, 0, 0));

      setStats({
        totalUsers: users.length,
        activeToday: users.filter(
          (u) => u.last_login_at && new Date(u.last_login_at) >= todayStart
        ).length,
        newThisWeek: users.filter(
          (u) => new Date(u.created_at) >= weekAgo
        ).length,
      });
    }
  };

  const visibleLinks = quickLinks.filter(
    (link) => !link.ownerOnly || isOwner
  );

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview and quick access to admin tools
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Today
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New This Week
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newThisWeek}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleLinks.map((link) => (
            <Link key={link.href} to={link.href}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <link.icon className="h-4 w-4 text-primary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-base">{link.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {link.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
