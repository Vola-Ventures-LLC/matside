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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { CreditCard, AlertCircle, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Navigate } from "react-router-dom";

interface Subscription {
  id: string;
  status: string;
  plan_id: string;
  seat_count: number | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  plan?: {
    name: string;
    price_cents: number;
    interval: string;
  };
}

export default function OrgBilling() {
  const { activeOrg, activeOrgId, canManageBilling } = useOrgContext();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!activeOrgId) return;

    setIsLoading(true);

    const { data, error } = await supabase
      .from("org_subscriptions")
      .select(`
        *,
        plan:subscription_plans(name, price_cents, interval)
      `)
      .eq("organization_id", activeOrgId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      toast({
        variant: "destructive",
        title: "Failed to fetch subscription",
        description: error.message,
      });
    } else {
      setSubscription(data);
    }

    setIsLoading(false);
  }, [activeOrgId]);

  useEffect(() => {
    if (activeOrgId) {
      fetchSubscription();
    }
  }, [activeOrgId, fetchSubscription]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-primary text-primary-foreground">Active</Badge>;
      case "trialing":
        return <Badge variant="secondary">Trial</Badge>;
      case "past_due":
        return <Badge variant="destructive">Past Due</Badge>;
      case "canceled":
        return <Badge variant="outline">Canceled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatPrice = (cents: number, interval: string) => {
    return `$${(cents / 100).toFixed(2)}/${interval}`;
  };

  if (!activeOrg) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!canManageBilling) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You don't have permission to manage billing</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <CreditCard className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="text-muted-foreground">
            Manage your organization's subscription
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" text="Loading billing..." />
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Your organization's active subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {subscription.plan?.name || "Custom Plan"}
                      </h3>
                      <p className="text-muted-foreground">
                        {subscription.plan && formatPrice(subscription.plan.price_cents, subscription.plan.interval)}
                        {subscription.seat_count && ` · ${subscription.seat_count} seats`}
                      </p>
                    </div>
                    {getStatusBadge(subscription.status)}
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Current Period</p>
                        <p className="text-sm text-muted-foreground">
                          {subscription.current_period_start && subscription.current_period_end
                            ? `${format(new Date(subscription.current_period_start), "MMM d")} - ${format(new Date(subscription.current_period_end), "MMM d, yyyy")}`
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    
                    {subscription.cancel_at_period_end && (
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <div>
                          <p className="text-sm font-medium">Cancellation Scheduled</p>
                          <p className="text-sm text-muted-foreground">
                            Ends {subscription.current_period_end && format(new Date(subscription.current_period_end), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />
                  <div className="flex gap-2">
                    <Button variant="outline">
                      Change Plan
                    </Button>
                    <Button variant="outline">
                      Manage Payment Method
                    </Button>
                    {!subscription.cancel_at_period_end && (
                      <Button variant="ghost" className="text-destructive">
                        Cancel Subscription
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
                  <p className="text-muted-foreground mb-4">
                    Choose a plan to unlock all features for your organization
                  </p>
                  <Button>
                    View Plans
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View past invoices and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>No billing history available</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
