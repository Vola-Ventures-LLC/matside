import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Gift,
  ArrowRight,
  Settings,
  Layers,
  Wallet,
} from "lucide-react";

interface AffiliateStats {
  totalAffiliates: number;
  pendingApplications: number;
  totalCommissions: number;
  pendingPayouts: number;
  totalReferrals: number;
}

export default function AdminAffiliates() {
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [affiliatesRes, commissionsRes, referralsRes] = await Promise.all([
      supabase.from("affiliates").select("status", { count: "exact" }),
      supabase.from("commission_events").select("commission_cents, status"),
      supabase.from("referrals").select("id", { count: "exact" }),
    ]);

    const affiliates = affiliatesRes.data || [];
    const commissions = commissionsRes.data || [];

    setStats({
      totalAffiliates: affiliates.filter(a => a.status === "approved").length,
      pendingApplications: affiliates.filter(a => a.status === "pending").length,
      totalCommissions: commissions.reduce((sum, c) => sum + (c.commission_cents || 0), 0),
      pendingPayouts: commissions
        .filter(c => c.status === "pending")
        .reduce((sum, c) => sum + (c.commission_cents || 0), 0),
      totalReferrals: referralsRes.count || 0,
    });

    setLoading(false);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Loading affiliate data..." />
      </div>
    );
  }

  const quickLinks = [
    {
      title: "Program Settings",
      description: "Attribution window, holdback, payouts",
      href: "/admin/affiliates/settings",
      icon: Settings,
    },
    {
      title: "Commission Tiers",
      description: "Manage tier levels and rates",
      href: "/admin/affiliates/tiers",
      icon: Layers,
    },
    {
      title: "Manage Affiliates",
      description: "View and approve affiliates",
      href: "/admin/affiliates/list",
      icon: Users,
    },
    {
      title: "Payouts",
      description: "Process pending payouts",
      href: "/admin/affiliates/payouts",
      icon: Wallet,
    },
  ];

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Gift className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Affiliate Program</h1>
          <p className="text-muted-foreground">
            Manage affiliates, commissions, and payouts
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Affiliates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAffiliates || 0}</div>
            {stats?.pendingApplications ? (
              <p className="text-xs text-muted-foreground">
                {stats.pendingApplications} pending approval
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No pending applications</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
            <p className="text-xs text-muted-foreground">All time signups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalCommissions || 0)}
            </div>
            <p className="text-xs text-muted-foreground">All time paid out</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.pendingPayouts || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Applications Alert */}
      {stats?.pendingApplications && stats.pendingApplications > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Badge variant="default" className="h-8 w-8 rounded-full p-0 flex items-center justify-center">
                {stats.pendingApplications}
              </Badge>
              <div>
                <p className="font-medium">Pending Applications</p>
                <p className="text-sm text-muted-foreground">
                  {stats.pendingApplications} affiliate{stats.pendingApplications !== 1 ? "s" : ""} waiting for approval
                </p>
              </div>
            </div>
            <Button asChild>
              <Link to="/admin/affiliates/list?status=pending">
                Review Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link) => (
          <Card key={link.href} className="hover:bg-muted/50 transition-colors">
            <Link to={link.href}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <link.icon className="h-5 w-5 text-primary" />
                  {link.title}
                </CardTitle>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
