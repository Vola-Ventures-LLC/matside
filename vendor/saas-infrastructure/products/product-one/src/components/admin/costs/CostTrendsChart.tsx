import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CostTrend, formatCost } from "@/hooks/useCostMonitoring";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";

interface CostTrendsChartProps {
  trends: CostTrend[] | undefined;
  isLoading: boolean;
}

export function CostTrendsChart({ trends, isLoading }: CostTrendsChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = trends?.map((trend) => ({
    ...trend,
    date: format(parseISO(trend.date), "MMM d"),
    // Convert to dollars for display
    ai_cost_dollars: trend.ai_cost / 100,
    email_cost_dollars: trend.email_cost / 100,
    sms_cost_dollars: trend.sms_cost / 100,
    total_cost_dollars: trend.total_cost / 100,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Trends</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    ai_cost_dollars: "AI",
                    email_cost_dollars: "Email",
                    sms_cost_dollars: "SMS",
                  };
                  return [`$${value.toFixed(4)}`, labels[name] || name];
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="ai_cost_dollars"
                name="AI"
                stackId="1"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="email_cost_dollars"
                name="Email"
                stackId="1"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="sms_cost_dollars"
                name="SMS"
                stackId="1"
                stroke="#F59E0B"
                fill="#F59E0B"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            No trend data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
