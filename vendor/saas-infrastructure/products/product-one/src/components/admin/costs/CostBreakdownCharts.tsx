import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CostStats, formatCost } from "@/hooks/useCostMonitoring";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface CostBreakdownChartsProps {
  stats: CostStats | undefined;
  isLoading: boolean;
}

const AI_COLORS = ["#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE"];
const EMAIL_COLORS = ["#10B981", "#34D399", "#6EE7B7", "#A7F3D0", "#D1FAE5", "#ECFDF5"];

export function CostBreakdownCharts({ stats, isLoading }: CostBreakdownChartsProps) {
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

  // AI by category data
  const aiData = Object.entries(stats?.ai_by_category || {}).map(
    ([category, cost], index) => ({
      name: formatCategoryName(category),
      value: cost,
      color: AI_COLORS[index % AI_COLORS.length],
    })
  );

  // Email by subdomain data
  const emailData = Object.entries(stats?.email_by_subdomain || {}).map(
    ([subdomain, cost], index) => ({
      name: formatCategoryName(subdomain),
      value: cost,
      color: EMAIL_COLORS[index % EMAIL_COLORS.length],
    })
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* AI Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-center mb-2">AI by Category</h4>
            {aiData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={aiData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label={({ name, value }) => `${name}: ${formatCost(value)}`}
                    labelLine={false}
                  >
                    {aiData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCost(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No AI usage data
              </div>
            )}
          </div>

          {/* Email Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-center mb-2">Email by Subdomain</h4>
            {emailData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={emailData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label={({ name, value }) => `${name}: ${formatCost(value)}`}
                    labelLine={false}
                  >
                    {emailData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCost(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No email usage data
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatCategoryName(category: string): string {
  const names: Record<string, string> = {
    "support-chat": "Support",
    "onboarding-chat": "Onboarding",
    "content-ai": "Content AI",
    "ticket-ai-draft": "Ticket Draft",
    transactional: "Transactional",
    marketing: "Marketing",
    support: "Support",
    billing: "Billing",
    notifications: "Notifications",
    outbound: "Outbound",
  };
  return names[category] || category;
}
