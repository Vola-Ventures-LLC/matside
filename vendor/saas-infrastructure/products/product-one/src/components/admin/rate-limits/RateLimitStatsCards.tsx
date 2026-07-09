import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, ShieldOff, AlertTriangle, Users, Globe, Activity } from "lucide-react";
import type { RateLimitStats } from "@/hooks/useRateLimitMonitoring";

interface RateLimitStatsCardsProps {
  stats: RateLimitStats | null;
  loading?: boolean;
}

export function RateLimitStatsCards({ stats, loading }: RateLimitStatsCardsProps) {
  const cards = [
    {
      title: "Total Alerts (24h)",
      value: stats?.totalAlerts24h ?? 0,
      icon: Activity,
      description: "All rate limit events",
      variant: "default" as const,
    },
    {
      title: "Blocked Requests",
      value: stats?.blockedRequests24h ?? 0,
      icon: ShieldOff,
      description: "Requests denied",
      variant: "destructive" as const,
    },
    {
      title: "Warning Alerts",
      value: stats?.warningAlerts24h ?? 0,
      icon: AlertTriangle,
      description: "Approaching limits",
      variant: "warning" as const,
    },
    {
      title: "Users Affected",
      value: stats?.uniqueUsersAffected ?? 0,
      icon: Users,
      description: "Unique users",
      variant: "default" as const,
    },
    {
      title: "IPs Affected",
      value: stats?.uniqueIPsAffected ?? 0,
      icon: Globe,
      description: "Unique IP addresses",
      variant: "default" as const,
    },
    {
      title: "Top Endpoint",
      value: stats?.topEndpoints[0]?.endpoint ?? "None",
      icon: ShieldAlert,
      description: stats?.topEndpoints[0] ? `${stats.topEndpoints[0].count} alerts` : "No data",
      variant: "default" as const,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.title} className={loading ? "animate-pulse" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            <card.icon
              className={`h-4 w-4 ${
                card.variant === "destructive"
                  ? "text-destructive"
                  : card.variant === "warning"
                    ? "text-yellow-500"
                    : "text-muted-foreground"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                card.variant === "destructive" && typeof card.value === "number" && card.value > 0
                  ? "text-destructive"
                  : card.variant === "warning" && typeof card.value === "number" && card.value > 0
                    ? "text-yellow-500"
                    : ""
              }`}
            >
              {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
