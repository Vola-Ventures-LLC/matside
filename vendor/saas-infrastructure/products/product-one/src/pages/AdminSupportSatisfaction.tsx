import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Star, 
  ThumbsUp, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  ArrowLeft,
  Quote
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Bar, BarChart, Cell } from "recharts";
import { useSupportSatisfactionMetrics } from "@/hooks/useSupportAnalytics";
import { getDateRangeFromPreset, type TimePreset, type DateRange } from "@/hooks/useAnalytics";
import { format, parseISO } from "date-fns";

const ratingChartConfig: ChartConfig = {
  avgRating: {
    label: "Avg Rating",
    color: "hsl(var(--primary))",
  },
  count: {
    label: "Responses",
    color: "hsl(var(--chart-2))",
  },
};


function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

export default function AdminSupportSatisfaction() {
  const [preset, setPreset] = useState<TimePreset>("30d");
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeFromPreset("30d"));

  const handlePresetChange = (newPreset: TimePreset) => {
    setPreset(newPreset);
    if (newPreset !== "custom") {
      setDateRange(getDateRangeFromPreset(newPreset));
    }
  };

  const metrics = useSupportSatisfactionMetrics(dateRange);

  const trendData = metrics.data?.ratingsTrend.map(item => ({
    ...item,
    dateFormatted: format(parseISO(item.date), "MMM d"),
  })) || [];

  const distributionData = metrics.data?.distribution.map(d => ({
    name: `${d.rating} star${d.rating !== 1 ? 's' : ''}`,
    value: d.count,
    rating: d.rating,
  })) || [];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/support">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="rounded-lg bg-primary/10 p-2">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Support Satisfaction</h1>
            <p className="text-muted-foreground text-sm">
              User ratings and feedback analytics
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

      {metrics.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Rating
                </CardTitle>
                <Star className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {metrics.data?.avgRating.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">/ 5</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {metrics.data?.avgRatingChange !== 0 && (
                    <span className={`flex items-center gap-1 text-xs font-medium ${
                      (metrics.data?.avgRatingChange || 0) > 0 
                        ? "text-emerald-500" 
                        : "text-destructive"
                    }`}>
                      {(metrics.data?.avgRatingChange || 0) > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(metrics.data?.avgRatingChange || 0)}%
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">vs previous</span>
                </div>
              </CardContent>
            </Card>

            <AnalyticsCard
              title="Satisfaction Rate"
              value={`${metrics.data?.satisfactionRate || 0}%`}
              description="4-5 star ratings"
              icon={ThumbsUp}
              variant={(metrics.data?.satisfactionRate || 0) >= 80 ? "success" : (metrics.data?.satisfactionRate || 0) >= 60 ? "warning" : "danger"}
            />

            <AnalyticsCard
              title="Response Rate"
              value={`${metrics.data?.responseRate || 0}%`}
              description={`${metrics.data?.totalRated || 0} of ${metrics.data?.closedConversations || 0} rated`}
              icon={MessageSquare}
            />

            <Card className={metrics.data?.nps && metrics.data.nps >= 50 ? "border-emerald-500/20 bg-emerald-500/5" : metrics.data?.nps && metrics.data.nps < 0 ? "border-destructive/20 bg-destructive/5" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  NPS Score
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.data?.nps || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(metrics.data?.nps || 0) >= 50 
                    ? "Excellent" 
                    : (metrics.data?.nps || 0) >= 0 
                      ? "Good" 
                      : "Needs improvement"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Rating Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rating Distribution</CardTitle>
                <CardDescription>Breakdown of all ratings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics.data?.distribution.map((d) => {
                  const total = metrics.data?.totalRated || 1;
                  const percentage = total > 0 ? (d.count / total) * 100 : 0;
                  return (
                    <div key={d.rating} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <StarRating rating={d.rating} />
                        </div>
                        <span className="text-muted-foreground">
                          {d.count} ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-2"
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Satisfaction Trend</CardTitle>
                <CardDescription>Average rating over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={ratingChartConfig} className="h-[200px] w-full">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradient-rating" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="dateFormatted"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      tickMargin={8}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={[0, 5]}
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      tickMargin={8}
                      width={30}
                    />
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <p className="font-medium">{data.dateFormatted}</p>
                            <p className="text-sm text-muted-foreground">
                              Avg: {data.avgRating} ({data.count} ratings)
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgRating"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#gradient-rating)"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Quote className="h-4 w-4" />
                Recent Feedback
              </CardTitle>
              <CardDescription>
                Comments from users who rated their support experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.data?.recentFeedback.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No feedback with comments yet
                </p>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {metrics.data?.recentFeedback.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <StarRating rating={item.rating} />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(item.ratedAt), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm">{item.feedback}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
