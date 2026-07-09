import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, User, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { RateLimitTopOffender } from "@/hooks/useRateLimitMonitoring";

interface RateLimitTopOffendersProps {
  offenders: RateLimitTopOffender[];
  loading?: boolean;
}

export function RateLimitTopOffenders({ offenders, loading }: RateLimitTopOffendersProps) {
  const columns: Column<RateLimitTopOffender>[] = [
    {
      key: "identifier_type",
      header: "Type",
      render: (offender) => (
        <Badge variant="outline" className="gap-1">
          {offender.identifier_type === "user" ? (
            <>
              <User className="h-3 w-3" /> User
            </>
          ) : (
            <>
              <Globe className="h-3 w-3" /> IP
            </>
          )}
        </Badge>
      ),
    },
    {
      key: "identifier",
      header: "Identifier",
      render: (offender) => (
        <span className="font-mono text-sm">
          {offender.identifier_type === "user" ? (
            <span className="text-primary" title={offender.user_id || ""}>
              {offender.user_id?.slice(0, 8)}...
            </span>
          ) : (
            <span className="text-muted-foreground">{offender.ip_address}</span>
          )}
        </span>
      ),
    },
    {
      key: "total_alerts",
      header: "Total Alerts",
      headerClassName: "text-right",
      className: "text-right font-mono font-medium",
    },
    {
      key: "blocked_count",
      header: "Blocked",
      headerClassName: "text-right",
      className: "text-right font-mono text-destructive",
    },
    {
      key: "warning_count",
      header: "Warnings",
      headerClassName: "text-right",
      className: "text-right font-mono text-yellow-500",
    },
    {
      key: "endpoints_affected",
      header: "Endpoints",
      sortable: false,
      render: (offender) => (
        <div className="flex flex-wrap gap-1">
          {offender.endpoints_affected.slice(0, 3).map((endpoint) => (
            <Badge key={endpoint} variant="secondary" className="text-xs">
              {endpoint}
            </Badge>
          ))}
          {offender.endpoints_affected.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{offender.endpoints_affected.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "last_alert_at",
      header: "Last Alert",
      render: (offender) => (
        <span className="text-muted-foreground text-sm">
          {formatDistanceToNow(new Date(offender.last_alert_at), { addSuffix: true })}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div>
              <CardTitle>Top Offenders (24h)</CardTitle>
              <CardDescription>Users and IPs with the most rate limit violations</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="text-center py-8">
              <div className="animate-pulse">Loading offenders...</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <div>
            <CardTitle>Top Offenders (24h)</CardTitle>
            <CardDescription>Users and IPs with the most rate limit violations</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <DataTable
            data={offenders}
            columns={columns}
            defaultSortKey="total_alerts"
            defaultSortDirection="desc"
            emptyMessage="No rate limit violations in the last 24 hours"
          />
        </div>
      </CardContent>
    </Card>
  );
}
