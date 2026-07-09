import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Wallet,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

interface Payout {
  id: string;
  affiliate_id: string;
  amount_cents: number;
  currency: string;
  payout_method: string;
  status: string;
  processed_at: string | null;
  failure_reason: string | null;
  created_at: string;
  affiliate?: {
    user_id: string;
    profile?: {
      display_name: string | null;
      email: string | null;
    };
  };
}

interface PendingCommission {
  affiliate_id: string;
  total_pending: number;
  affiliate?: {
    user_id: string;
    payout_method: string;
    profile?: {
      display_name: string | null;
      email: string | null;
    };
  };
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  processing: "bg-blue-500/10 text-blue-600 border-blue-200",
  completed: "bg-green-500/10 text-green-600 border-green-200",
  failed: "bg-red-500/10 text-red-600 border-red-200",
};

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  processing: Clock,
  completed: CheckCircle,
  failed: XCircle,
};

export default function AdminAffiliatePayouts() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [pendingCommissions, setPendingCommissions] = useState<PendingCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [processing, setProcessing] = useState(false);
  const { logAction } = useAuditLog();

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch payouts
    let payoutQuery = supabase
      .from("commission_payouts")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      payoutQuery = payoutQuery.eq("status", statusFilter);
    }

    const { data: payoutsData } = await payoutQuery;

    // Fetch pending commissions grouped by affiliate
    const { data: pendingData } = await supabase
      .from("commission_events")
      .select("affiliate_id, commission_cents")
      .eq("status", "pending");

    // Group pending commissions by affiliate
    const pendingByAffiliate = (pendingData || []).reduce((acc, curr) => {
      if (!acc[curr.affiliate_id]) {
        acc[curr.affiliate_id] = 0;
      }
      acc[curr.affiliate_id] += curr.commission_cents;
      return acc;
    }, {} as Record<string, number>);

    // Fetch affiliate details
    const affiliateIds = [
      ...new Set([
        ...(payoutsData || []).map((p) => p.affiliate_id),
        ...Object.keys(pendingByAffiliate),
      ]),
    ];

    const { data: affiliates } = await supabase
      .from("affiliates")
      .select("id, user_id, payout_method")
      .in("id", affiliateIds);

    const userIds = affiliates?.map((a) => a.user_id) || [];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, email")
      .in("user_id", userIds);

    // Enrich payouts
    const enrichedPayouts = (payoutsData || []).map((payout) => {
      const affiliate = affiliates?.find((a) => a.id === payout.affiliate_id);
      const profile = profiles?.find((p) => p.user_id === affiliate?.user_id);
      return {
        ...payout,
        affiliate: affiliate ? { ...affiliate, profile } : undefined,
      };
    });

    // Build pending commissions list
    const enrichedPending = Object.entries(pendingByAffiliate).map(([affiliateId, total]) => {
      const affiliate = affiliates?.find((a) => a.id === affiliateId);
      const profile = profiles?.find((p) => p.user_id === affiliate?.user_id);
      return {
        affiliate_id: affiliateId,
        total_pending: total,
        affiliate: affiliate ? { ...affiliate, profile } : undefined,
      };
    });

    setPayouts(enrichedPayouts);
    setPendingCommissions(enrichedPending.filter((p) => p.total_pending > 0));
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const markAsProcessed = async (payoutId: string) => {
    setProcessing(true);

    const { error } = await supabase
      .from("commission_payouts")
      .update({
        status: "completed",
        processed_at: new Date().toISOString(),
      })
      .eq("id", payoutId);

    if (error) {
      toast({ variant: "destructive", title: "Failed to update payout", description: error.message });
    } else {
      toast({ title: "Payout marked as completed" });
      logAction({ action: "PAYOUT_COMPLETED", details: { payout_id: payoutId } });
      setSelectedPayout(null);
      fetchData();
    }

    setProcessing(false);
  };

  const markAsFailed = async (payoutId: string, reason: string) => {
    setProcessing(true);

    const { error } = await supabase
      .from("commission_payouts")
      .update({
        status: "failed",
        failure_reason: reason,
      })
      .eq("id", payoutId);

    if (error) {
      toast({ variant: "destructive", title: "Failed to update payout", description: error.message });
    } else {
      toast({ title: "Payout marked as failed" });
      logAction({ action: "PAYOUT_FAILED", details: { payout_id: payoutId, reason } });
      setSelectedPayout(null);
      fetchData();
    }

    setProcessing(false);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const payoutColumns: Column<Payout>[] = [
    {
      key: "affiliate",
      header: "Affiliate",
      render: (payout) => (
        <div>
          <p className="font-medium">
            {payout.affiliate?.profile?.display_name || "Unknown"}
          </p>
          <p className="text-sm text-muted-foreground">
            {payout.affiliate?.profile?.email}
          </p>
        </div>
      ),
    },
    {
      key: "amount_cents",
      header: "Amount",
      render: (payout) => (
        <span className="font-medium">{formatCurrency(payout.amount_cents)}</span>
      ),
    },
    {
      key: "payout_method",
      header: "Method",
      render: (payout) => (
        <Badge variant="outline" className="capitalize">
          {payout.payout_method}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (payout) => {
        const StatusIcon = statusIcons[payout.status] || AlertCircle;
        return (
          <Badge variant="outline" className={statusColors[payout.status]}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {payout.status}
          </Badge>
        );
      },
    },
    {
      key: "created_at",
      header: "Requested",
      render: (payout) => (
        <span className="text-muted-foreground">
          {format(new Date(payout.created_at), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      key: "processed_at",
      header: "Processed",
      render: (payout) => (
        <span className="text-muted-foreground">
          {payout.processed_at
            ? format(new Date(payout.processed_at), "MMM d, yyyy")
            : "-"}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Loading payouts..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/affiliates">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Payouts</h1>
            <p className="text-muted-foreground">
              Process affiliate commission payouts
            </p>
          </div>
        </div>
      </div>

      {/* Pending Commissions */}
      {pendingCommissions.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Commissions
            </CardTitle>
            <CardDescription>
              These commissions are ready for payout after holdback period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingCommissions.map((pending) => (
                <div
                  key={pending.affiliate_id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-background"
                >
                  <div>
                    <p className="font-medium">
                      {pending.affiliate?.profile?.display_name || "Unknown Affiliate"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {pending.affiliate?.profile?.email} • {pending.affiliate?.payout_method}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(pending.total_pending)}
                    </p>
                    <p className="text-xs text-muted-foreground">pending</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>All processed and pending payouts</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {payouts.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={Wallet}
                title="No payouts found"
                description="Payout records will appear here when affiliates request payouts"
              />
            </div>
          ) : (
            <DataTable
              data={payouts}
              columns={payoutColumns}
              onRowClick={(payout) => setSelectedPayout(payout)}
              defaultSortKey="created_at"
              defaultSortDirection="desc"
            />
          )}
        </CardContent>
      </Card>

      {/* Payout Detail Sheet */}
      <Sheet open={!!selectedPayout} onOpenChange={(open) => !open && setSelectedPayout(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Payout Details</SheetTitle>
            <SheetDescription>
              Review and process this payout request
            </SheetDescription>
          </SheetHeader>
          {selectedPayout && (
            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Affiliate</p>
                  <p className="font-medium">
                    {selectedPayout.affiliate?.profile?.display_name || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium text-lg">
                    {formatCurrency(selectedPayout.amount_cents)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Method</p>
                  <p className="font-medium capitalize">{selectedPayout.payout_method}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="outline" className={statusColors[selectedPayout.status]}>
                    {selectedPayout.status}
                  </Badge>
                </div>
              </div>

              {selectedPayout.failure_reason && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm font-medium text-destructive">Failure Reason</p>
                  <p className="text-sm">{selectedPayout.failure_reason}</p>
                </div>
              )}
            </div>
          )}
          <SheetFooter className="mt-6">
            {selectedPayout?.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => markAsFailed(selectedPayout.id, "Manually rejected by admin")}
                  disabled={processing}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Mark Failed
                </Button>
                <Button
                  onClick={() => markAsProcessed(selectedPayout.id)}
                  disabled={processing}
                >
                  {processing ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Mark Completed
                </Button>
              </>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
