import { useState } from "react";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { AreaChartCard } from "@/components/analytics/AreaChartCard";
import { DonutChartCard } from "@/components/analytics/DonutChartCard";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import {
  useRevenueMetrics,
  getDateRangeFromPreset,
  type TimePreset,
  type DateRange,
} from "@/hooks/useAnalytics";
import { DollarSign, CreditCard, AlertTriangle, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function BillingAnalytics() {
  const [preset, setPreset] = useState<TimePreset>("30d");
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeFromPreset("30d"));

  const handlePresetChange = (newPreset: TimePreset) => {
    setPreset(newPreset);
    if (newPreset !== "custom") {
      setDateRange(getDateRangeFromPreset(newPreset));
    }
  };

  const revenueMetrics = useRevenueMetrics(dateRange);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Billing Analytics</h1>
            <p className="text-muted-foreground">
              Track revenue, subscriptions, and credit sales
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

      {revenueMetrics.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <AnalyticsCard
              title="Monthly Recurring Revenue"
              value={formatCurrency(revenueMetrics.data?.mrr || 0)}
              description="Current MRR"
              icon={DollarSign}
              variant="success"
            />
            <AnalyticsCard
              title="Active Subscriptions"
              value={revenueMetrics.data?.activeSubscriptions.toLocaleString() || "0"}
              description="Users & orgs"
              icon={CreditCard}
            />
            <AnalyticsCard
              title="Credits Sold"
              value={revenueMetrics.data?.creditSales.toLocaleString() || "0"}
              description="This period"
              icon={CreditCard}
            />
            <AnalyticsCard
              title="Churn Rate"
              value={`${revenueMetrics.data?.churnRate || 0}%`}
              description="Cancellations this period"
              icon={AlertTriangle}
              variant={
                (revenueMetrics.data?.churnRate || 0) > 5
                  ? "danger"
                  : (revenueMetrics.data?.churnRate || 0) > 2
                  ? "warning"
                  : "default"
              }
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <AreaChartCard
              title="Credit Purchases"
              description="Credit pack sales over time"
              data={revenueMetrics.data?.creditTrend || []}
              color="hsl(var(--chart-3))"
            />
            <DonutChartCard
              title="Subscription Status"
              description="Breakdown by status"
              data={
                revenueMetrics.data?.statusBreakdown.map((s) => ({
                  name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
                  value: s.count,
                })) || []
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
