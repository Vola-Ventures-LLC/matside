import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  useCostMonitoring,
  formatCost,
  AccountCostSummary,
} from "@/hooks/useCostMonitoring";
import { CostStatsCards } from "@/components/admin/costs/CostStatsCards";
import { CostBreakdownCharts } from "@/components/admin/costs/CostBreakdownCharts";
import { CostTrendsChart } from "@/components/admin/costs/CostTrendsChart";
import { ManualCostEntry } from "@/components/admin/costs/ManualCostEntry";
import { RefreshCw, Search, Download } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export default function AdminCosts() {
  const [dateRange, setDateRange] = useState({
    start: startOfDay(subDays(new Date(), 30)),
    end: endOfDay(new Date()),
  });
  const [searchQuery, setSearchQuery] = useState("");

  const { stats, accounts, trends, isLoading, refetch } =
    useCostMonitoring(dateRange);

  const filteredAccounts = accounts?.filter((account) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      account.email?.toLowerCase().includes(query) ||
      account.display_name?.toLowerCase().includes(query) ||
      account.user_id.toLowerCase().includes(query)
    );
  });

  const accountColumns: Column<AccountCostSummary>[] = [
    {
      key: "display_name",
      header: "Account",
      render: (account) => (
        <div>
          <div className="font-medium">
            {account.display_name || "Unknown User"}
          </div>
          <div className="text-sm text-muted-foreground">
            {account.email || account.user_id.slice(0, 8)}
          </div>
        </div>
      ),
    },
    {
      key: "ai_support_cost",
      header: "AI Support",
      headerClassName: "text-right",
      render: (account) =>
        account.ai_support_cost > 0 ? (
          <Badge variant="secondary">{formatCost(account.ai_support_cost)}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "ai_onboarding_cost",
      header: "AI Onboarding",
      headerClassName: "text-right",
      render: (account) =>
        account.ai_onboarding_cost > 0 ? (
          <Badge variant="secondary">{formatCost(account.ai_onboarding_cost)}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "ai_features_cost",
      header: "AI Features",
      headerClassName: "text-right",
      render: (account) =>
        account.ai_features_cost > 0 ? (
          <Badge variant="secondary">{formatCost(account.ai_features_cost)}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "email_cost",
      header: "Email",
      headerClassName: "text-right",
      render: (account) => {
        const emailTotal = Object.values(account.email_by_subdomain).reduce(
          (a, b) => a + b,
          0
        );
        return emailTotal > 0 ? (
          <Badge variant="outline">{formatCost(emailTotal)}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      key: "sms_cost",
      header: "SMS",
      headerClassName: "text-right",
      render: (account) =>
        account.sms_cost > 0 ? (
          <Badge variant="outline">{formatCost(account.sms_cost)}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "storage_cost",
      header: "Storage",
      headerClassName: "text-right",
      render: (account) =>
        account.storage_cost > 0 ? (
          <Badge variant="outline">{formatCost(account.storage_cost)}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "stripe_fees",
      header: "Stripe",
      headerClassName: "text-right",
      render: (account) =>
        account.stripe_fees > 0 ? (
          <Badge variant="outline">{formatCost(account.stripe_fees)}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "total_cost",
      header: "Total",
      headerClassName: "text-right",
      className: "text-right font-medium",
      render: (account) => formatCost(account.total_cost),
    },
  ];

  const handleExportCSV = () => {
    if (!accounts) return;

    const headers = [
      "User ID",
      "Email",
      "Display Name",
      "AI Support Cost",
      "AI Onboarding Cost",
      "AI Features Cost",
      "AI Ticket Cost",
      "Email Cost",
      "SMS Cost",
      "Total Cost",
    ];

    const rows = accounts.map((account) => {
      const emailTotal = Object.values(account.email_by_subdomain).reduce(
        (a, b) => a + b,
        0
      );
      return [
        account.user_id,
        account.email || "",
        account.display_name || "",
        formatCost(account.ai_support_cost),
        formatCost(account.ai_onboarding_cost),
        formatCost(account.ai_features_cost),
        formatCost(account.ai_ticket_cost),
        formatCost(emailTotal),
        formatCost(account.sms_cost),
        formatCost(account.total_cost),
      ];
    });

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cost-report-${format(dateRange.start, "yyyy-MM-dd")}-${format(dateRange.end, "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cost Monitoring</h1>
          <p className="text-muted-foreground mt-1">
            Track AI, email, and SMS costs per account
          </p>
        </div>
        <div className="flex gap-2">
          <ManualCostEntry onSuccess={() => refetch()} />
          <Button variant="outline" onClick={handleExportCSV} disabled={!accounts}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Range Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4 items-center">
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground">From:</span>
              <Input
                type="date"
                value={format(dateRange.start, "yyyy-MM-dd")}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    start: startOfDay(new Date(e.target.value)),
                  }))
                }
                className="w-40"
              />
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground">To:</span>
              <Input
                type="date"
                value={format(dateRange.end, "yyyy-MM-dd")}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    end: endOfDay(new Date(e.target.value)),
                  }))
                }
                className="w-40"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDateRange({
                    start: startOfDay(subDays(new Date(), 7)),
                    end: endOfDay(new Date()),
                  })
                }
              >
                7 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDateRange({
                    start: startOfDay(subDays(new Date(), 30)),
                    end: endOfDay(new Date()),
                  })
                }
              >
                30 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDateRange({
                    start: startOfDay(subDays(new Date(), 90)),
                    end: endOfDay(new Date()),
                  })
                }
              >
                90 days
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <CostStatsCards stats={stats} isLoading={isLoading} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CostBreakdownCharts stats={stats} isLoading={isLoading} />
        <CostTrendsChart trends={trends} isLoading={isLoading} />
      </div>

      {/* Per-Account Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cost by Account</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable
              data={filteredAccounts || []}
              columns={accountColumns}
              defaultSortKey="total_cost"
              defaultSortDirection="desc"
              emptyMessage="No accounts found"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
