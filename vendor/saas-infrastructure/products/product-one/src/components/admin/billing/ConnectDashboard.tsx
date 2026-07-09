import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { StripeSetupBanner } from "./StripeSetupBanner";
import {
  Building2,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";

interface App {
  id: string;
  name: string;
  slug: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface ConnectAccount {
  id: string;
  organization_id: string;
  app_id: string;
  stripe_account_id: string | null;
  status: "pending" | "active" | "restricted" | "disabled";
  onboarding_completed: boolean;
  payouts_enabled: boolean;
  charges_enabled: boolean;
  created_at: string;
  organization?: Organization;
}

interface PlatformTransaction {
  id: string;
  connect_account_id: string;
  gross_amount_cents: number;
  platform_fee_cents: number;
  net_amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
}

export function ConnectDashboard() {
  const [apps, setApps] = useState<App[]>([]);
  const [accounts, setAccounts] = useState<ConnectAccount[]>([]);
  const [transactions, setTransactions] = useState<PlatformTransaction[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  const fetchApps = useCallback(async () => {
    const { data } = await supabase
      .from("apps")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("name");

    if (data && data.length > 0) {
      setApps(data);
      setSelectedAppId(data[0].id);
    }
    setIsLoading(false);
  }, []);

  const checkConfiguration = useCallback(async () => {
    const { data } = await supabase
      .from("app_stripe_configs")
      .select("is_configured, connect_enabled")
      .eq("app_id", selectedAppId)
      .single();

    setIsConfigured(data?.is_configured && data?.connect_enabled);
  }, [selectedAppId]);

  const fetchAccountsAndTransactions = useCallback(async () => {
    const [accountsResult, txResult] = await Promise.all([
      supabase
        .from("org_connect_accounts")
        .select(`
          *,
          organization:organizations(id, name, slug)
        `)
        .eq("app_id", selectedAppId)
        .order("created_at", { ascending: false }),
      supabase
        .from("platform_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (accountsResult.error) {
      toast({
        variant: "destructive",
        title: "Failed to fetch accounts",
        description: accountsResult.error.message,
      });
    } else {
      setAccounts(accountsResult.data || []);
    }

    if (!txResult.error) {
      setTransactions(txResult.data || []);
    }
  }, [selectedAppId]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  useEffect(() => {
    if (selectedAppId) {
      fetchAccountsAndTransactions();
      checkConfiguration();
    }
  }, [selectedAppId, fetchAccountsAndTransactions, checkConfiguration]);

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const getStatusIcon = (status: ConnectAccount["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "restricted":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "disabled":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: ConnectAccount["status"]) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      pending: "secondary",
      restricted: "secondary",
      disabled: "destructive",
    };
    return (
      <Badge variant={variants[status]} className="capitalize">
        {getStatusIcon(status)}
        <span className="ml-1">{status}</span>
      </Badge>
    );
  };

  // Calculate stats
  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.gross_amount_cents, 0);
  const totalFees = transactions.reduce((sum, tx) => sum + tx.platform_fee_cents, 0);
  const activeAccounts = accounts.filter((a) => a.status === "active").length;

  // Define columns for Connected Accounts table
  const accountColumns: Column<ConnectAccount>[] = [
    {
      key: "organization",
      header: "Organization",
      render: (account) => (
        <div>
          <p className="font-medium">
            {account.organization?.name || "Unknown"}
          </p>
          <p className="text-xs text-muted-foreground">
            {account.stripe_account_id || "Pending setup"}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (account) => getStatusBadge(account.status),
    },
    {
      key: "payouts_enabled",
      header: "Payouts",
      render: (account) =>
        account.payouts_enabled ? (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            Enabled
          </Badge>
        ) : (
          <Badge variant="secondary">Disabled</Badge>
        ),
    },
    {
      key: "charges_enabled",
      header: "Charges",
      render: (account) =>
        account.charges_enabled ? (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            Enabled
          </Badge>
        ) : (
          <Badge variant="secondary">Disabled</Badge>
        ),
    },
    {
      key: "created_at",
      header: "Connected",
      render: (account) => format(new Date(account.created_at), "MMM d, yyyy"),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "w-[80px]",
      sortable: false,
      render: (account) =>
        account.stripe_account_id ? (
          <Button variant="ghost" size="sm" asChild>
            <a
              href={`https://dashboard.stripe.com/connect/accounts/${account.stripe_account_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        ) : null,
    },
  ];

  // Define columns for Transactions table
  const transactionColumns: Column<PlatformTransaction>[] = [
    {
      key: "created_at",
      header: "Date",
      render: (tx) => format(new Date(tx.created_at), "MMM d, yyyy HH:mm"),
    },
    {
      key: "gross_amount_cents",
      header: "Gross Amount",
      render: (tx) => (
        <span className="font-medium">{formatPrice(tx.gross_amount_cents, tx.currency)}</span>
      ),
    },
    {
      key: "platform_fee_cents",
      header: "Platform Fee",
      render: (tx) => (
        <span className="text-green-600">
          +{formatPrice(tx.platform_fee_cents, tx.currency)}
        </span>
      ),
    },
    {
      key: "net_amount_cents",
      header: "Vendor Payout",
      render: (tx) => formatPrice(tx.net_amount_cents, tx.currency),
    },
    {
      key: "status",
      header: "Status",
      render: (tx) => (
        <Badge variant="outline" className="capitalize">
          {tx.status}
        </Badge>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <LoadingSpinner size="lg" text="Loading Connect dashboard..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Stripe Connect Dashboard</CardTitle>
                <CardDescription>
                  Manage vendor accounts and platform transactions
                </CardDescription>
              </div>
            </div>
            {apps.length > 0 && (
              <Select value={selectedAppId} onValueChange={setSelectedAppId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select app" />
                </SelectTrigger>
                <SelectContent>
                  {apps.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isConfigured && (
            <StripeSetupBanner
              isConfigured={isConfigured}
              appName={apps.find((a) => a.id === selectedAppId)?.name}
            />
          )}

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Active Vendors</p>
              <p className="text-2xl font-bold">{activeAccounts}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Total Volume</p>
              <p className="text-2xl font-bold">{formatPrice(totalRevenue, "usd")}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Platform Fees</p>
              <p className="text-2xl font-bold">{formatPrice(totalFees, "usd")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Vendors</CardTitle>
          <CardDescription>Organizations with Stripe Connect accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No connected vendors"
              description="Organizations will appear here once they connect their Stripe accounts"
            />
          ) : (
            <div className="rounded-md border">
              <DataTable
                data={accounts}
                columns={accountColumns}
                defaultSortKey="created_at"
                defaultSortDirection="desc"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Platform Transactions</CardTitle>
          <CardDescription>Latest payments processed through Connect</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No transactions yet"
              description="Platform transactions will appear here once vendors start processing payments"
            />
          ) : (
            <div className="rounded-md border">
              <DataTable
                data={transactions}
                columns={transactionColumns}
                defaultSortKey="created_at"
                defaultSortDirection="desc"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
