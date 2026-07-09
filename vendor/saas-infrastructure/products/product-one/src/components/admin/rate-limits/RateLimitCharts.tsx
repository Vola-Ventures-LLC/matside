import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { BarChart3, PieChartIcon } from "lucide-react";
import { format } from "date-fns";

interface TimeSeriesDataPoint {
  hour: string;
  blocked: number;
  warning: number;
  threshold: number;
}

interface PieChartDataPoint {
  endpoint: string;
  count: number;
}

interface RateLimitChartsProps {
  timeSeriesData: TimeSeriesDataPoint[];
  pieChartData: PieChartDataPoint[];
  loading?: boolean;
}

const areaChartConfig: ChartConfig = {
  blocked: {
    label: "Blocked",
    color: "hsl(var(--destructive))",
  },
  warning: {
    label: "Warning",
    color: "hsl(45, 93%, 47%)",
  },
  threshold: {
    label: "Threshold",
    color: "hsl(var(--muted-foreground))",
  },
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(45, 93%, 47%)",
  "hsl(var(--muted-foreground))",
  "hsl(280, 70%, 50%)",
  "hsl(160, 60%, 45%)",
];

export function RateLimitCharts({ timeSeriesData, pieChartData, loading }: RateLimitChartsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Alert Trends (48h)</CardTitle>
              <CardDescription>Rate limit events over time</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">Loading chart...</div>
            </div>
          ) : timeSeriesData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          ) : (
            <ChartContainer config={areaChartConfig} className="h-[300px]">
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="blockedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="warningGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="hour"
                  tickFormatter={(value) => format(new Date(value), "HH:mm")}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => format(new Date(value), "MMM d, HH:mm")}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="blocked"
                  stroke="hsl(var(--destructive))"
                  fill="url(#blockedGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="warning"
                  stroke="hsl(45, 93%, 47%)"
                  fill="url(#warningGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Pie Chart by Endpoint */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Alerts by Endpoint</CardTitle>
              <CardDescription>Distribution of rate limit events</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">Loading chart...</div>
            </div>
          ) : pieChartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="endpoint"
                    label={({ endpoint, percent }) =>
                      percent > 0.05 ? `${endpoint} (${(percent * 100).toFixed(0)}%)` : ""
                    }
                    labelLine={false}
                  >
                    {pieChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => <span className="text-sm">{value}</span>}
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
