import { useState } from "react";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { AreaChartCard } from "@/components/analytics/AreaChartCard";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import {
  useUserMetrics,
  getDateRangeFromPreset,
  type TimePreset,
  type DateRange,
} from "@/hooks/useAnalytics";
import { Users, UserPlus, Activity, TrendingUp, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserAnalytics() {
  const [preset, setPreset] = useState<TimePreset>("30d");
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeFromPreset("30d"));

  const handlePresetChange = (newPreset: TimePreset) => {
    setPreset(newPreset);
    if (newPreset !== "custom") {
      setDateRange(getDateRangeFromPreset(newPreset));
    }
  };

  const userMetrics = useUserMetrics(dateRange);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">User Analytics</h1>
            <p className="text-muted-foreground">
              Track user signups, activity, and growth
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

      {userMetrics.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <AnalyticsCard
              title="Total Users"
              value={userMetrics.data?.totalUsers.toLocaleString() || "0"}
              description="All registered users"
              icon={Users}
            />
            <AnalyticsCard
              title="New Signups"
              value={userMetrics.data?.newSignups.toLocaleString() || "0"}
              trend={userMetrics.data?.growthRate}
              trendLabel="vs previous period"
              icon={UserPlus}
            />
            <AnalyticsCard
              title="Active Users"
              value={userMetrics.data?.activeUsers.toLocaleString() || "0"}
              description="Logged in during period"
              icon={Activity}
            />
            <AnalyticsCard
              title="Growth Rate"
              value={`${userMetrics.data?.growthRate || 0}%`}
              description="Signup growth"
              icon={TrendingUp}
              variant={
                (userMetrics.data?.growthRate || 0) > 0
                  ? "success"
                  : (userMetrics.data?.growthRate || 0) < 0
                  ? "danger"
                  : "default"
              }
            />
          </div>
          <AreaChartCard
            title="New Signups Over Time"
            description="Daily new user registrations"
            data={userMetrics.data?.signupsTrend || []}
          />
        </>
      )}
    </div>
  );
}
