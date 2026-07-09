import { ShieldAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RateLimitStatsCards,
  RateLimitAlertsTable,
  RateLimitTopOffenders,
  RateLimitCharts,
} from "@/components/admin/rate-limits";
import { useRateLimitMonitoring, useRateLimitChartData } from "@/hooks/useRateLimitMonitoring";

export default function AdminRateLimits() {
  const { alerts, stats, topOffenders, usageSummary, loading, refetch } = useRateLimitMonitoring();
  const { timeSeriesData, pieChartData } = useRateLimitChartData(usageSummary);

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Rate Limit Monitoring</h1>
            <p className="text-muted-foreground">
              Monitor API usage, blocked requests, and identify abuse patterns
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <RateLimitStatsCards stats={stats} loading={loading} />

      {/* Tabs for different views */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Live Alerts</TabsTrigger>
          <TabsTrigger value="offenders">Top Offenders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <RateLimitAlertsTable alerts={alerts} loading={loading} />
        </TabsContent>

        <TabsContent value="offenders" className="space-y-4">
          <RateLimitTopOffenders offenders={topOffenders} loading={loading} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <RateLimitCharts
            timeSeriesData={timeSeriesData}
            pieChartData={pieChartData}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
