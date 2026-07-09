import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import {
  getDateRangeFromPreset,
  type TimePreset,
  type DateRange,
} from "@/hooks/useAnalytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  DollarSign,
  Users,
  Building2,
  CreditCard,
  Coins,
  Unlock,
  TrendingUp,
  LayoutDashboard,
} from "lucide-react";
import { format } from "date-fns";

interface OverviewMetrics {
  totalMRR: number;
  userSubscriptions: number;
  orgSubscriptions: number;
  totalCredits: number;
  userCredits: number;
  orgCredits: number;
  oneTimeSales: number;
  recentTransactions: Transaction[];
}

interface Transaction {
  id: string;
  type: "subscription" | "credit" | "one_time";
  entity: "user" | "org";
  entityName: string;
  amount: number;
  description: string;
  date: string;
}

export default function AdminBillingOverview() {
  const { isOwner } = useAuth();
  const [preset, setPreset] = useState<TimePreset>("30d");
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeFromPreset("30d"));
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<OverviewMetrics>({
    totalMRR: 0,
    userSubscriptions: 0,
    orgSubscriptions: 0,
    totalCredits: 0,
    userCredits: 0,
    orgCredits: 0,
    oneTimeSales: 0,
    recentTransactions: [],
  });

  const handlePresetChange = (newPreset: TimePreset) => {
    setPreset(newPreset);
    if (newPreset !== "custom") {
      setDateRange(getDateRangeFromPreset(newPreset));
    }
  };

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);

    const [userSubsResult, orgSubsResult, userCreditsResult, orgCreditsResult, unlocksResult] = await Promise.all([
      // User subscriptions
      supabase
        .from("user_subscriptions")
        .select(`*, plan:subscription_plans(price_cents, interval)`)
        .eq("status", "active"),
      // Org subscriptions
      supabase
        .from("org_subscriptions")
        .select(`*, plan:subscription_plans(price_cents, interval)`)
        .eq("status", "active"),
      // User credit balances
      supabase
        .from("user_credit_balances")
        .select("*"),
      // Org credit balances
      supabase
        .from("org_credit_balances")
        .select("*"),
      // Feature unlocks
      supabase
        .from("feature_unlocks")
        .select(`*, product:one_time_products(price_cents, name)`)
        .gte("unlocked_at", dateRange.from.toISOString())
        .lte("unlocked_at", dateRange.to.toISOString()),
    ]);

    // Calculate user MRR
    const userMRR = (userSubsResult.data || []).reduce((sum, sub) => {
      if (!sub.plan) return sum;
      const monthly = sub.plan.interval === "year"
        ? sub.plan.price_cents / 12
        : sub.plan.price_cents;
      return sum + monthly;
    }, 0);

    // Calculate org MRR
    const orgMRR = (orgSubsResult.data || []).reduce((sum, sub) => {
      if (!sub.plan) return sum;
      const monthly = sub.plan.interval === "year"
        ? sub.plan.price_cents / 12
        : sub.plan.price_cents;
      return sum + monthly;
    }, 0);

    // Calculate credit balances
    const userCreditsTotal = (userCreditsResult.data || []).reduce((sum, b) => sum + b.balance, 0);
    const orgCreditsTotal = (orgCreditsResult.data || []).reduce((sum, b) => sum + b.balance, 0);

    // Calculate one-time sales
    const oneTimeSales = (unlocksResult.data || []).reduce((sum, u) => {
      return sum + (u.product?.price_cents || 0);
    }, 0);

    // Build recent transactions list
    const transactions: Transaction[] = [];

    // Add recent subscriptions
    (userSubsResult.data || []).slice(0, 5).forEach((sub) => {
      transactions.push({
        id: sub.id,
        type: "subscription",
        entity: "user",
        entityName: `User ${sub.user_id.slice(0, 8)}...`,
        amount: sub.plan?.price_cents || 0,
        description: `Subscription`,
        date: sub.created_at,
      });
    });

    (orgSubsResult.data || []).slice(0, 5).forEach((sub) => {
      transactions.push({
        id: sub.id,
        type: "subscription",
        entity: "org",
        entityName: `Org ${sub.organization_id.slice(0, 8)}...`,
        amount: sub.plan?.price_cents || 0,
        description: `Subscription`,
        date: sub.created_at,
      });
    });

    // Sort by date
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setMetrics({
      totalMRR: (userMRR + orgMRR) / 100,
      userSubscriptions: userSubsResult.data?.length || 0,
      orgSubscriptions: orgSubsResult.data?.length || 0,
      totalCredits: userCreditsTotal + orgCreditsTotal,
      userCredits: userCreditsTotal,
      orgCredits: orgCreditsTotal,
      oneTimeSales: oneTimeSales / 100,
      recentTransactions: transactions.slice(0, 10),
    });

    setIsLoading(false);
  }, [dateRange]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (!isOwner) {
    return <Navigate to="/admin" replace />;
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Monetization Overview</h1>
            <p className="text-muted-foreground">
              Revenue across all billing streams - users and organizations
            </p>
          </div>
        </div>
        <DateRangePicker
          preset={preset}
          dateRange={dateRange}
          onPresetChange={handlePresetChange}
          onDateRangeChange={setDateRange}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading metrics..." />
        </div>
      ) : (
        <>
          {/* Top-level metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <AnalyticsCard
              title="Total MRR"
              value={formatCurrency(metrics.totalMRR)}
              description="Combined recurring revenue"
              icon={DollarSign}
              variant="success"
            />
            <AnalyticsCard
              title="Active Subscriptions"
              value={(metrics.userSubscriptions + metrics.orgSubscriptions).toString()}
              description={`${metrics.userSubscriptions} users, ${metrics.orgSubscriptions} orgs`}
              icon={CreditCard}
            />
            <AnalyticsCard
              title="Credit Balance"
              value={metrics.totalCredits.toLocaleString()}
              description={`${metrics.userCredits} user, ${metrics.orgCredits} org credits`}
              icon={Coins}
            />
            <AnalyticsCard
              title="One-Time Sales"
              value={formatCurrency(metrics.oneTimeSales)}
              description="Feature unlocks this period"
              icon={Unlock}
            />
          </div>

          {/* Breakdown tabs */}
          <Tabs defaultValue="subscriptions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="credits">Credits</TabsTrigger>
              <TabsTrigger value="onetime">One-Time</TabsTrigger>
            </TabsList>

            <TabsContent value="subscriptions" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">User Subscriptions</CardTitle>
                    </div>
                    <CardDescription>Individual personal subscriptions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">{metrics.userSubscriptions}</span>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Personal billing for individual accounts
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">Org Subscriptions</CardTitle>
                    </div>
                    <CardDescription>Organization team subscriptions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">{metrics.orgSubscriptions}</span>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Team billing with seat-based pricing
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="credits" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">User Credits</CardTitle>
                    </div>
                    <CardDescription>Personal credit balances</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">{metrics.userCredits.toLocaleString()}</span>
                        <Badge>Credits</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Total credits held by individual users
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">Org Credits</CardTitle>
                    </div>
                    <CardDescription>Organization credit pools</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">{metrics.orgCredits.toLocaleString()}</span>
                        <Badge>Credits</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Shared credit pools for teams
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="onetime" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Unlock className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">Feature Unlocks</CardTitle>
                  </div>
                  <CardDescription>One-time purchases and lifetime access</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{formatCurrency(metrics.oneTimeSales)}</span>
                      <Badge variant="outline">This Period</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Revenue from feature unlocks and one-time purchases for both users and organizations
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Recent activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Recent Activity</CardTitle>
              </div>
              <CardDescription>Latest billing events across all streams</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.recentTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No recent transactions
                </p>
              ) : (
                <div className="space-y-3">
                  {metrics.recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        {tx.entity === "user" ? (
                          <Users className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{tx.entityName}</p>
                          <p className="text-xs text-muted-foreground">
                            {tx.description} • {format(new Date(tx.date), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {tx.type}
                        </Badge>
                        <span className="font-medium text-sm">
                          {formatCurrency(tx.amount / 100)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
