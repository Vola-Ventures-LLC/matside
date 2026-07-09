import { useState } from "react";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { RateLimitAlert } from "@/hooks/useRateLimitMonitoring";

interface RateLimitAlertsTableProps {
  alerts: RateLimitAlert[];
  loading?: boolean;
}

export function RateLimitAlertsTable({ alerts, loading }: RateLimitAlertsTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [endpointFilter, setEndpointFilter] = useState<string>("all");

  // Get unique endpoints for filter
  const endpoints = [...new Set(alerts.map((a) => a.endpoint))];

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      search === "" ||
      alert.endpoint.toLowerCase().includes(search.toLowerCase()) ||
      alert.ip_address?.toLowerCase().includes(search.toLowerCase()) ||
      alert.user_id?.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === "all" || alert.alert_type === typeFilter;
    const matchesEndpoint = endpointFilter === "all" || alert.endpoint === endpointFilter;

    return matchesSearch && matchesType && matchesEndpoint;
  });

  const getAlertTypeBadge = (type: RateLimitAlert["alert_type"]) => {
    switch (type) {
      case "blocked":
        return <Badge variant="destructive">Blocked</Badge>;
      case "warning":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Warning</Badge>;
      case "threshold":
        return <Badge variant="secondary">Threshold</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getUsageColor = (percent: number) => {
    if (percent >= 100) return "text-destructive";
    if (percent >= 80) return "text-yellow-500";
    if (percent >= 60) return "text-orange-400";
    return "text-muted-foreground";
  };

  const columns: Column<RateLimitAlert>[] = [
    {
      key: "alert_type",
      header: "Type",
      render: (alert) => getAlertTypeBadge(alert.alert_type),
    },
    {
      key: "endpoint",
      header: "Endpoint",
      className: "font-mono text-sm",
    },
    {
      key: "user_id",
      header: "Identifier",
      render: (alert) => (
        <span className="font-mono text-sm">
          {alert.user_id ? (
            <span className="text-primary" title={alert.user_id}>
              {alert.user_id.slice(0, 8)}...
            </span>
          ) : (
            <span className="text-muted-foreground">{alert.ip_address || "Unknown"}</span>
          )}
        </span>
      ),
    },
    {
      key: "usage_count",
      header: "Usage",
      headerClassName: "text-right",
      render: (alert) => (
        <span className="text-right font-mono">{alert.usage_count.toLocaleString()}</span>
      ),
    },
    {
      key: "limit_value",
      header: "Limit",
      headerClassName: "text-right",
      render: (alert) => (
        <span className="text-right font-mono text-muted-foreground">
          {alert.limit_value.toLocaleString()}
        </span>
      ),
    },
    {
      key: "usage_percent",
      header: "%",
      headerClassName: "text-right",
      render: (alert) => (
        <span className={`text-right font-mono font-medium ${getUsageColor(alert.usage_percent)}`}>
          {alert.usage_percent.toFixed(1)}%
        </span>
      ),
    },
    {
      key: "window_minutes",
      header: "Window",
      render: (alert) => <span className="text-muted-foreground">{alert.window_minutes}m</span>,
    },
    {
      key: "created_at",
      header: "Time",
      render: (alert) => (
        <span className="text-muted-foreground text-sm">
          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Rate Limit Alerts</CardTitle>
                <CardDescription>Real-time monitoring of rate limit events</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="text-center py-8">
              <div className="animate-pulse">Loading alerts...</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Rate Limit Alerts</CardTitle>
              <CardDescription>Real-time monitoring of rate limit events</CardDescription>
            </div>
          </div>
          <Badge variant="outline">{filteredAlerts.length} alerts</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by endpoint, user, or IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Alert Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="threshold">Threshold</SelectItem>
            </SelectContent>
          </Select>
          <Select value={endpointFilter} onValueChange={setEndpointFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Endpoint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Endpoints</SelectItem>
              {endpoints.map((endpoint) => (
                <SelectItem key={endpoint} value={endpoint}>
                  {endpoint}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <DataTable
            data={filteredAlerts.slice(0, 50)}
            columns={columns}
            defaultSortKey="created_at"
            defaultSortDirection="desc"
            emptyMessage="No rate limit alerts found"
          />
        </div>
      </CardContent>
    </Card>
  );
}
