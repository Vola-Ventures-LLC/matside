import { useState } from "react";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { AreaChartCard } from "@/components/analytics/AreaChartCard";
import { TopPostsTable } from "@/components/analytics/TopPostsTable";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import {
  useContentMetrics,
  getDateRangeFromPreset,
  type TimePreset,
  type DateRange,
} from "@/hooks/useAnalytics";
import { FileText, Eye, Clock, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContentAnalytics() {
  const [preset, setPreset] = useState<TimePreset>("30d");
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeFromPreset("30d"));

  const handlePresetChange = (newPreset: TimePreset) => {
    setPreset(newPreset);
    if (newPreset !== "custom") {
      setDateRange(getDateRangeFromPreset(newPreset));
    }
  };

  const contentMetrics = useContentMetrics(dateRange);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Content Analytics</h1>
            <p className="text-muted-foreground">
              Track blog performance and engagement
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

      {contentMetrics.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <AnalyticsCard
              title="Total Posts"
              value={contentMetrics.data?.totalPosts.toLocaleString() || "0"}
              description="Published articles"
              icon={FileText}
            />
            <AnalyticsCard
              title="Posts This Period"
              value={contentMetrics.data?.postsInPeriod.toLocaleString() || "0"}
              description="Newly published"
              icon={FileText}
            />
            <AnalyticsCard
              title="Total Views"
              value={contentMetrics.data?.totalViews.toLocaleString() || "0"}
              description="All-time page views"
              icon={Eye}
            />
            <AnalyticsCard
              title="Avg Reading Time"
              value={`${contentMetrics.data?.avgReadingTime || 0} min`}
              description="Average per post"
              icon={Clock}
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <AreaChartCard
              title="Posts Published"
              description="New content over time"
              data={contentMetrics.data?.publishTrend || []}
              color="hsl(var(--chart-2))"
            />
            <TopPostsTable posts={contentMetrics.data?.topPosts || []} />
          </div>
        </>
      )}
    </div>
  );
}
