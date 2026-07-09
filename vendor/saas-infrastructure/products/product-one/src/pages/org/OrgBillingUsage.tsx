import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/hooks/useOrgContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { BarChart3, Coins, TrendingUp } from "lucide-react";
import { Navigate } from "react-router-dom";

interface CreditBalance {
  balance: number;
  lifetime_purchased: number;
  lifetime_used: number;
}

export default function OrgBillingUsage() {
  const { activeOrg, activeOrgId, canManageBilling } = useOrgContext();
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    if (!activeOrgId) return;

    setIsLoading(true);

    const { data, error } = await supabase
      .from("org_credit_balances")
      .select("*")
      .eq("organization_id", activeOrgId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      toast({
        variant: "destructive",
        title: "Failed to fetch usage",
        description: error.message,
      });
    } else {
      setCreditBalance(data);
    }

    setIsLoading(false);
  }, [activeOrgId]);

  useEffect(() => {
    if (activeOrgId) {
      fetchUsage();
    }
  }, [activeOrgId, fetchUsage]);

  if (!activeOrg) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!canManageBilling) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You don't have permission to view usage</p>
      </div>
    );
  }

  const usagePercent = creditBalance && creditBalance.lifetime_purchased > 0
    ? Math.round((creditBalance.lifetime_used / creditBalance.lifetime_purchased) * 100)
    : 0;

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Usage</h1>
          <p className="text-muted-foreground">
            Track your organization's resource usage
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" text="Loading usage..." />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Current Balance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Credit Balance
              </CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {creditBalance?.balance.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                credits available
              </p>
            </CardContent>
          </Card>

          {/* Lifetime Purchased */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Lifetime Purchased
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {creditBalance?.lifetime_purchased.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                total credits purchased
              </p>
            </CardContent>
          </Card>

          {/* Lifetime Used */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Lifetime Used
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {creditBalance?.lifetime_used.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                total credits consumed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Overview</CardTitle>
          <CardDescription>
            Your organization's credit consumption
          </CardDescription>
        </CardHeader>
        <CardContent>
          {creditBalance && creditBalance.lifetime_purchased > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Credits Used</span>
                <span className="font-medium">{usagePercent}%</span>
              </div>
              <Progress value={usagePercent} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{creditBalance.lifetime_used.toLocaleString()} used</span>
                <span>{creditBalance.lifetime_purchased.toLocaleString()} total</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No usage data available yet</p>
              <p className="text-sm">Purchase credits to start tracking usage</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
